# Philips Hue Configuration Manager

A TypeScript/Node.js tool to manage your Philips Hue lighting system configuration as code, providing a "source of truth" for your smart lighting setup.

## Features

- **Bridge Discovery**: Automatically find your Hue bridge on the network
- **API Authentication**: Easy setup with bridge button press authentication
- **Configuration Export**: Export your current lighting setup to JSON files
- **Configuration Management**: Version control your lighting configurations
- **TypeScript Support**: Full type safety and IntelliSense support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Discover Your Hue Bridge

```bash
npm run discover-bridge
```

### 3. Get API Key (requires pressing bridge button)

```bash
npm run get-api-key
```

### 4. Export Current Configuration

```bash
npm run export-config
```

## Authentication

The Philips Hue API requires local network access to your Hue Bridge. You'll need to:

1. Find your bridge's IP address (automatic with discovery script)
2. Press the physical button on the bridge when prompted
3. The tool will create an API key and save it to a `.env` file

## Next Steps

Once you have authentication set up, you can:

- Export your current configuration to JSON files
- Modify the configuration files to match your desired setup
- Apply configuration changes back to your bridge
- Version control your lighting setup with Git

## Project Structure

```
├── config/          # Configuration files (JSON)
├── src/             # TypeScript source code
├── scripts/         # Utility scripts
├── backups/         # Configuration backups
└── .env            # Bridge credentials (created automatically)
```

## Contributing

This project is open source. Feel free to submit issues and pull requests!
