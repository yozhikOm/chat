# user-auth Specification

## Purpose

Lets users enter the chat application: it provides the login and registration entry point, establishes and persists an authenticated session, and shows the initial authenticated view built from server data.

## Requirements

### Requirement: Entry screen when unauthenticated
The system SHALL show an entry screen with login and registration forms whenever there is no valid session.

#### Scenario: First visit
- **WHEN** the user opens the app with no stored session
- **THEN** the system shows the entry screen with login and registration forms and no chat UI

#### Scenario: After logout
- **WHEN** the user logs out
- **THEN** the system returns to the entry screen

### Requirement: User login
The system SHALL authenticate a user by submitting username and password to the login endpoint and, on success, store the returned token and username in the browser's persistent storage and enter the authenticated view.

#### Scenario: Successful login
- **WHEN** the user submits a valid username and password
- **THEN** the system stores the session and shows the authenticated view with the user's channel list

#### Scenario: Invalid credentials
- **WHEN** the user submits a username or password rejected by the server
- **THEN** the system stays on the entry screen and shows a Russian-language error message that the credentials are invalid

#### Scenario: Server unreachable
- **WHEN** the server cannot be reached during login
- **THEN** the system stays on the entry screen and shows a Russian-language network error message

### Requirement: User registration
The system SHALL create a new user by submitting username and password to the registration endpoint and, on success, treat the session exactly as after a successful login.

#### Scenario: Successful registration
- **WHEN** the user registers a username that is not yet taken and a password
- **THEN** the system stores the session and shows the authenticated view

#### Scenario: Username already taken
- **WHEN** the user registers a username that already exists
- **THEN** the system stays on the entry screen and shows a Russian-language error message that the username is taken

### Requirement: Session persistence
The system SHALL keep the authenticated session across page reloads without requiring re-authentication.

#### Scenario: Reload while authenticated
- **WHEN** the user reloads the page while a session exists
- **THEN** the system opens the authenticated view without showing the entry screen

### Requirement: Session validation on entry
The system SHALL validate the stored token by loading the initial data once the authenticated view opens, and SHALL clear an invalid session and return to the entry screen.

#### Scenario: Valid session loads data
- **WHEN** the authenticated view opens and the stored token is valid
- **THEN** the system shows the channel list and current channel from the server data

#### Scenario: Invalid or missing token
- **WHEN** the server rejects the stored token
- **THEN** the system clears the stored session and returns to the entry screen

#### Scenario: Transient server failure
- **WHEN** the server cannot be reached while loading initial data
- **THEN** the system keeps the stored session, shows a Russian-language error message, and does not log the user out

### Requirement: Authenticated view
The system SHALL render, after authentication, a header with the current username and a logout action, a channel list depicting the server channels with the current channel indicated, and an empty message area placeholder awaiting the chat feature.

#### Scenario: Channel list rendered
- **WHEN** the authenticated view opens with server data
- **THEN** the system displays each channel name and marks the current channel

### Requirement: Logout
The system SHALL clear the stored session and return to the entry screen when the user activates logout.

#### Scenario: User logs out
- **WHEN** the user clicks the logout action
- **THEN** the system removes the stored token and username and shows the entry screen