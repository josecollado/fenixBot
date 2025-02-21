# Fenix Discord Bot

A Discord bot for managing server access and roles with advanced security features.

## Features

- Role-based access control system
- Special code verification
- Security monitoring and logging
- Automated role management
- Admin notifications for security events

## Prerequisites

- Node.js v16.9.0 or higher
- Discord.js v14
- A Discord server with appropriate permissions

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fenixBot.git
cd fenixBot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
   - Copy `.env.example` to `.env` and fill in your bot token and client ID
   - Copy `config/example.permissions.json` to `config/permissions.json` and customize the settings

4. Start the bot:
```bash
npm start
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:
- `DISCORD_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your bot's client ID
- `NODE_ENV`: Environment (development/production)

### Permissions Configuration

The `permissions.json` file contains:
- Admin role configuration
- Command permissions
- Role assignments
- Log channel settings

## Security Features

- Rate limiting for code attempts
- Automatic user kicks after 5 failed attempts
- Admin notifications for security events
- Secure role management
- Comprehensive logging system

## Commands

- `/bouncer`: Manages server access control
- Additional commands as configured in permissions.json

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 