## MODIFIED Requirements

### Requirement: Authenticated view

The system SHALL render, after authentication, a header with the current username and a logout action, a channel list depicting the server channels with the current channel indicated, and the message area that displays the chat of the current channel.

#### Scenario: Channel list rendered

- **WHEN** the authenticated view opens with server data
- **THEN** the system displays each channel name and marks the current channel

#### Scenario: Message area rendered

- **WHEN** the authenticated view opens with server data
- **THEN** the system displays the message area for the current channel