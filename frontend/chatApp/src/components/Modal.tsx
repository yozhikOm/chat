import type React from 'react';
import type { ReactNode } from 'react';

interface IModalProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onSubmit: () => void;
  onClose: () => void;
  danger?: boolean;
  disabled?: boolean;
  error?: string | null;
}

const Modal: React.FunctionComponent<IModalProps> = ({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Отмена',
  onSubmit,
  onClose,
  danger = false,
  disabled = false,
  error = null,
}: IModalProps) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-btn${danger ? ' danger' : ''}`}
            onClick={onSubmit}
            disabled={disabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;