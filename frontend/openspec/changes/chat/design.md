## Context

Бекенд (Fastify + Socket.IO, порт 3000) уже отдаёт полный API: REST `GET /api/v1/data` возвращает `{channels, currentChannelId, messages}`, сокет события `newMessage`, `newChannel`, `renameChannel`, `removeChannel` бродкастят всем клиентам с ack-колбэком `{status: 'ok'}`. Сокет работает без авторизации (plugin.js:23 — `TODO add socket auth`), клиент передаёт `username` в payload.

Фронтенд (`chatApp/`) — React 19 + Vite 8 + TypeScript 6. Единственные зависимости: `react`, `react-dom`. Уже реализованы: LoginPage, AppShell (загружает `/data`, показывает каналы, пустая message-панель). Vite проксирует `/api` на `http://localhost:3000`.

**Типы данных на фронте** (из `api/auth.ts`):
```typescript
type Channel = { id: number; name: string; removable: boolean }
type Message = { id: number; body: string; channelId: number; username: string }
type InitialData = { channels: Channel[]; currentChannelId: number; messages: Message[] }
```

**Socket.IO события** (из backend README):
```
emit: newMessage  {body, channelId, username}  -> ack {status:'ok'} -> broadcast {body, channelId, id, username}
emit: newChannel   {name}                       -> ack {status:'ok', data:{id,name,removable:true}} -> broadcast {id,name,removable:true}
emit: removeChannel {id}                        -> ack {status:'ok'} -> broadcast {id}
emit: renameChannel {id, name}                  -> ack {status:'ok'} -> broadcast {id,name,removable:true}
```

## Goals / Non-Goals

**Goals:**
- Реализовать real-time чат: история, отправка, каналы.
- Минимальная нагрузка: одна зависимость (zustand) + socket.io-client, без роутера, без UI-библиотек.
- Консистентность: стили чата используют существующие CSS-переменные (`--bg-elevated`, `--accent`, `--border`, `--danger`).

**Non-Goals:**
- Авторизация сокета (сервер не поддерживает; изменение бекенда — отдельный future change).
- Пагинация истории (нет API, история загружается целиком).
- Принадлежность каналов пользователям, реакции на сообщения, тайпинг-индикаторы.
- Оффлайн-режим / queue сообщений.
- Деплой-конфигурация для прода (Proxy в dev, prod — отдельный вопрос).

## Decisions

### 1. Zustand-стор для состояния чата

**Решение:** Единый zustand store `useChatStore` хранит `channels`, `messages`, `activeChannelId`, `connected` (статус сокета) и экшены для инициализации данных, переключения канала, отправки, CRUD каналов, обработки событий сокета.

**Почему zustand, а не context+useReducer:**
- Меньше бойлерплейта: нет провайдера, нет типа контекста, нет диспатчера. Экшены вызываются напрямую из компонентов.
- Подписка на отдельные поля: компонент `ChannelList` перерендеривается только при изменении `channels` или `activeChannelId`, а не при каждом новом сообщении.
- Стабильные экшены: zustand не теряет ссылку на функции после ре-рендера (проблема context с useCallback).

**Альтернативы:** Context+useReducer (reject — больше boilerplate, нет подписок по селекторам). Redux Toolkit (reject — тяжело для такого масштаба, нет cross-slice логики).

### 2. Socket lifecycle: подключение при монтировании AppShell

**Решение:** В `AppShell` при монтировании создаётся сокет-инстанс (`io('/', { autoConnect: true })`), подписки на события регистрируются через `store`-экшены. При `onLogout` — сокет `disconnect()`.

**Почему именно здесь:**
- AppShell рендерится только при наличии валидного токена — сокет живёт ровно столько, сколько сессия.
- При перезагрузке страницы токен из localStorage → AppShell → подключение к сокету — нет потери состояния.
- При 401 от `/data` → `onLogout()` → сокет отключается — чистый exit.

**Лайфхаки Vite:** Прокси `/socket.io` с `ws: true` в `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000' },
    '/socket.io': { target: 'http://localhost:3000', ws: true },
  }
}
```
Клиент `io('/')` проксируется на бекенд через Vite dev-сервер. В проде — same origin (deploy фронта и бекенда на одном домене).

### 3. Модель данных стора

```typescript
interface ChatState {
  // Данные
  channels: Channel[]
  messages: Message[]
  activeChannelId: number | null
  connected: boolean

  // Экшены
  initFromServer: (data: InitialData) => void
  setActiveChannel: (id: number) => void
  addChannel: (channel: Channel) => void
  removeChannel: (id: number) => void
  renameChannel: (channel: Channel) => void
  addMessage: (message: Message) => void
  setConnected: (v: boolean) => void
}
```

**Инициализация:** `AppShell` загружает `GET /api/v1/data`, вызывает `initFromServer(data)` — стор заполняется историей, `activeChannelId` берётся из `currentChannelId`.

**Реакция на сокет:** Обработчики событий вызывают соответствующие экшены стора:
- `newMessage` → `addMessage(payload)` — сообщение добавляется, если оно принадлежит активному каналу, автоскролл активируется.
- `newChannel` → `addChannel(channel)` — канал добавляется в список; в `data-testid` или CSS помечается как новый.
- `removeChannel` → `removeChannel(id)` — канал удаляется; если `activeChannelId === id` → первый оставшийся.
- `renameChannel` → `renameChannel(channel)` — имя обновляется.

### 4. Отправка сообщений и каналов через ack

**Решение:** При эмите `newMessage`/`newChannel`/`renameChannel`/`removeChannel` используется ack-колбэк. Если ack не получен в течение таймаута (3 сек) или пришла ошибка — показать русскоязычное сообщение об ошибке в интерфейсе.

**Оптимистичное обновление:** Сервер бродкастит обратно `{status:'ok'}` + данные. На фронте **не** делаем оптимистичного append до ack — ждём ack, потом сервер сам шлёт broadcast, добавляющий данные в стор. Это исключает дубликаты и рассинхрон при fail.

### 5. Единый модальный компонент

**Решение:** Один общий компонент `Modal.tsx` (на чистом CSS, без portals и библиотек), кнопки и заголовок которого задаются пропсами:

```typescript
type ModalProps = {
  title: string
  children: ReactNode            // тело: поле ввода формы или текст вопроса
  confirmLabel: string           // текст кнопки Submit
  cancelLabel?: string           // текст кнопки Cancel (по умолчанию «Отмена»)
  onSubmit: () => void
  onClose: () => void
  danger?: boolean               // красная кнопка подтверждения (удаление)
  disabled?: boolean             // блокировка Submit
  error?: string | null          // строка ошибки, если нужна
}
```

`children` закрывает оба варианта содержимого:
- создание/переименование: дети — форма с полем имени, обёрнутая `ChannelModal` (см. ниже);
- подтверждение удаления: дети — текст вопроса; `ConfirmRemoveModal` отдельно **не создаётся** — в `ChannelList` вызывается общий `Modal` напрямую (`danger` + вопрос).

`ChannelModal` остаётся отдельным компонентом намеренно: у него управляемый инпут, валидация и режим create/rename — это не помещается в «пропсовую» модалку без раздувания её API. Но своего shell-оверлея он не пишет — рендерится внутри общего `Modal` как `children`, владея состоянием поля и ошибкой.

**Стили оверлея:** `position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px)`; `.modal-card` — карточка по центру (как `.login-card`), с существующими CSS-переменными.

### 6. Валидация на клиенте

**Константы:**
```typescript
const CHANNEL_NAME_MIN = 2
const CHANNEL_NAME_MAX = 20
const MESSAGE_MAX = 500
```

- Имя канала: `trim().length >= CHANNEL_NAME_MIN && length <= CHANNEL_NAME_MAX`
- Сообщение: `trim().length > 0 && length <= MESSAGE_MAX`
- Ошибки на русском языке в UI, не отправляются на сервер.

### 7. Автоскролл

**Решение:** `useRef` на контейнер сообщений + `useEffect` по `messages.length` (фильтр по активному каналу). Перед scrollIntoView проверяется: `Math.abs(scrollHeight - scrollTop - clientHeight) < 40px` (то есть пользователь не отмотал вверх). Если отмотал — не прокручиваем.

### 8. Расширение типа Message

Сервер бэкенда не имеет timestamp в `Message`. Ограничение: отображаем `username` + `body`. Сортировка по `id` (порядок серверного `getNextId()` монотонный, автоинкремент). В спеке не требуется timestamp, поэтому в тип добавляем только `{ id, body, channelId, username }` — как есть.

## Risks / Trade-offs

- **[Нет авторизации сокета]** → Любой клиент может подключиться к сокету и писать сообщения от чужого имени (username передаётся клиентом). Приём для учебного приложения, в проде нужно добавить `socket.on('connect', ...)` с проверкой JWT. Mitigation: отдельный future change на бекенде, пока non-goal.

- **[Оптимистичное обновление отключено]** → Небольшая задержка (RTT + ack) между отправкой и появлением сообщения. Mitigation: приёмлемо для учебного приложения; можно добавить оптимистичный append + rollback при ошибке в будущем.

- **[N+1 перерендеров]** → Zustand селекторы решают это; `MessagePane` перерендеривается при изменении `messages.length` для активного канала. При 1000+ сообщениях может быть задержка. Mitigation: при необходимости добавить `React.memo` на `MessageItem` или virtual scroll.

- **[Vite dev proxy не работает в проде]** → Прод-деплой требует same-origin за reverse proxy. Mitigation: отдельный вопрос деплоя (non-goal).

- **[Два openspec-корня]** → Активный openspec-репозиторий фронта (`frontend/openspec/`) не виден из корня `chat/`. Mitigation: при архиве и будущих изменениях работать из `frontend/` или использовать `--root frontend`.

## Open Questions

- Порядок сортировки каналов в боковой панели. Предполагаем: `general` → `random` → пользовательские по алфавиту. Сервер не гарантирует порядок. Пока: как есть (порядок из `/data`).
- Дублирование имён каналов: сервер не проверяет уникальность. Можно ли создать два канала «general»? В спеке не запрещено, пока оставляем как есть (поведение сервера).
