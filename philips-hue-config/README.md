# Philips Hue Configuration Manager

A TypeScript/Node.js tool to manage your Philips Hue lighting system configuration as code.

## Quick Start

1. `npm install` - Install dependencies
2. `npm run discover-bridge` - Find your Hue bridge
3. `npm run get-api-key` - Authenticate (requires bridge button press)
4. `npm run export-config` - Export your current setup

## What This Does

- **Bridge Discovery**: Automatically finds your Hue bridge on the network
- **API Authentication**: Sets up secure access to your bridge  
- **Configuration Export**: Saves your lights, rooms, and scenes as JSON files
- **Version Control**: Track changes to your lighting setup with Git

## Authentication

You'll need to press the physical button on your Hue bridge when prompted. This creates an API key that gets saved to a `.env` file (which is gitignored for security).

## Project Structure

- `config/` - Your exported lighting configuration (JSON files)
- `scripts/` - CLI tools for managing your setup
- `backups/` - Timestamped backups of your configurations
- `.env` - Bridge credentials (created automatically)
