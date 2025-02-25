# Configuration Files Documentation

This directory contains example configuration files for the Fenix Bot. Below is an explanation of the structure and properties used in these files.

## permissions.example.json

This file defines the permission structure for commands and roles in the bot.

### Command Properties

Each command in the `commands` object has the following properties:

- **roles**: Array of roles that can use this command
- **description**: Description shown in help command
- **public**: Whether this command can be used by anyone (`true`) or only specified roles (`false`)
- **reply**: Whether the bot should reply to the command (`true`) or not (`false`)
- **cooldown**: Settings for command rate limiting
  - **duration**: Cooldown duration in seconds
  - **type**: Type of cooldown: 'user' (per user), 'channel' (per channel), etc.
  - **usages**: Number of times the command can be used before cooldown is triggered

### Example

```json
"ban": {
  "roles": ["ADMIN"],
  "description": "Ban a user from the server",
  "public": false,
  "reply": true,
  "cooldown": {
    "duration": 5,
    "type": "user",
    "usages": 1
  }
}
```

## admin.example.js

This file contains the admin functionality for permission checking and cooldown management. It exports an object with methods for:

- Checking if commands exist
- Verifying role access to commands
- Checking admin status
- Managing command cooldowns

To use these configuration files:

1. Copy the example files and remove the `.example` suffix
2. Modify the values to match your server's configuration
3. Keep these files secure as they contain sensitive permission information
