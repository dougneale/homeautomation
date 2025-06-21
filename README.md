# Philips Hue Configuration Management

A TypeScript/Node.js tool to manage your Philips Hue lighting system configuration as code. Export, version control, and manage your entire lighting setup programmatically.

## 🎯 Overview

This project allows you to:
- **Export** your complete Hue configuration to JSON files
- **Version control** your lighting setup with Git
- **Backup** configurations with timestamps
- **Manage** lights, rooms, scenes, and devices as code
- **Support** both legacy API v1 and modern API v2

## 🏠 Your Current Setup

**Bridge Information:**
- **Model**: BSB002 (Hue Bridge v2)
- **IP Address**: 192.168.0.219
- **Software**: 1971060010 (May 2025)
- **API Support**: v1 (HTTP) + v2 (HTTPS) ✅

**Discovered Resources:**
- 🔦 **14 lights** (color bulbs, white bulbs, light strips)
- 🏠 **6-10 rooms/groups** (Doug's Room, Kitchen, Salon, Bathroom, etc.)
- 🎭 **78-89 scenes** (Relax, Read, Concentrate, custom scenes)
- 🔧 **20 devices** (switches, sensors, bridge)
- 📱 **9 sensors** (dimmer switches, motion sensors, tap switches)

## 🚀 Quick Start

### 1. Setup
```bash
# Install dependencies
npm install

# Discover your bridge
npm run discover-bridge

# Get API key (requires pressing bridge button)
npm run get-api-key
```

### 2. Export Configuration
```bash
# Modern API v2 (recommended)
npm run export-config

# Legacy API v1 (for compatibility)
npm run export-config-v1
```

## 📋 Available Commands

| Command | Description | API Version |
|---------|-------------|-------------|
| `npm run discover-bridge` | Find Hue bridge on network | - |
| `npm run get-api-key` | Authenticate with bridge | - |
| `npm run export-config` | Export using modern API v2 | v2 (HTTPS) |
| `npm run export-config-v1` | Export using legacy API v1 | v1 (HTTP) |
| `npm run export-config-legacy` | Original v2 script (broken) | v2 (HTTP) |

## 📁 File Structure

```
homeautomation/
├── config/                     # Exported configurations
│   ├── lights-v2.json         # 🔦 Lights (API v2) - 16KB
│   ├── rooms-v2.json          # 🏠 Rooms (API v2) - 4KB  
│   ├── scenes-v2.json         # 🎭 Scenes (API v2) - 176KB
│   ├── devices-v2.json        # 🔧 Devices (API v2) - 24KB
│   ├── lights.json            # 🔦 Lights (API v1) - 8KB
│   ├── rooms.json             # 🏠 Groups (API v1) - 8KB
│   ├── scenes.json            # 🎭 Scenes (API v1) - 48KB
│   ├── sensors.json           # 📱 Sensors (API v1) - 20KB
│   └── bridge.json            # ⚙️ Bridge config (API v1) - 28KB
├── backups/                    # Timestamped backups
│   ├── backup-2025-06-21T13-20-57-987Z/    # API v1 backup
│   └── backup-v2-2025-06-21T13-29-38-333Z/ # API v2 backup
├── scripts/                    # Management scripts
│   ├── discover-bridge.ts      # Bridge discovery
│   ├── get-api-key.ts         # Authentication
│   ├── export-config-v1.ts    # Legacy export
│   ├── export-config-v2.ts    # Modern export
│   └── export-config.ts       # Original (broken)
├── src/types/                  # TypeScript definitions
└── .env                       # API credentials (gitignored)
```

## 🔄 API v1 vs v2 Comparison

### API v1 (Legacy - HTTP)
```json
{
  "lights": {
    "1": {
      "name": "Desk Lamp",
      "type": "Extended color light",
      "state": {"on": false, "brightness": 254}
    }
  }
}
```

**Pros:**
- ✅ Stable and well-established
- ✅ Works with all bridges
- ✅ Simple REST endpoints

**Cons:**
- ⚠️ Numeric IDs can change
- ⚠️ No real-time events
- ⚠️ Limited metadata

### API v2 (Modern - HTTPS)
```json
{
  "lights": {
    "0536201c-4b23-4d6b-ba89-f6973310834b": {
      "id": "0536201c-4b23-4d6b-ba89-f6973310834b",
      "id_v1": "/lights/3",
      "name": "Doug Lamp",
      "archetype": "table_shade",
      "function": "mixed"
    }
  }
}
```

**Pros:**
- ✅ **Stable UUIDs** (never change)
- ✅ **Rich metadata** (archetype, function)
- ✅ **Better relationships** between resources
- ✅ **Real-time events** support
- ✅ **Future-proof**

**Cons:**
- ⚠️ HTTPS required
- ⚠️ More complex structure

## 🔧 Configuration Files Explained

### Lights
**Contains:** All bulbs, strips, and light fixtures
- Names, types, and current states
- Color capabilities and brightness levels
- Hardware information and software versions

### Rooms/Groups  
**Contains:** Room definitions and light groupings
- Room assignments (Doug's Room, Kitchen, etc.)
- Light memberships
- Room archetypes (Bedroom, Kitchen, etc.)

### Scenes
**Contains:** Lighting presets and moods
- Scene names (Relax, Read, Concentrate, etc.)
- Light states for each scene
- Color settings and brightness levels

### Devices (v2 only)
**Contains:** Physical hardware information
- Bridge, switches, sensors, motion detectors
- Model numbers, software versions
- Service capabilities

### Sensors (v1 only)
**Contains:** Interactive devices
- Dimmer switches, motion sensors
- Battery levels and connectivity
- Button configurations

## 🔐 Security & Environment

**Environment Variables** (`.env`):
```bash
HUE_BRIDGE_IP=192.168.0.219
HUE_API_KEY=VxCfEeAXMSaq190p11fGzOQm3qG5NOMbEpfpx9hZ
```

**Gitignored Files:**
- `.env` - Contains API credentials
- `backups/` - Local backups only
- `node_modules/` - Dependencies

## 📈 Current Status

### ✅ Working Features
- **Bridge Discovery** - Automatic network scanning
- **Authentication** - One-time setup with button press
- **Export v1** - Complete legacy API export 
- **Export v2** - Modern API with rich metadata
- **Automatic Backups** - Timestamped snapshots
- **TypeScript Support** - Full type safety

### 🚧 Next Steps (Future)
- **Apply Configuration** - Upload changes back to bridge
- **Diff System** - Compare configurations
- **Scene Management** - Create/edit scenes programmatically
- **Automation** - Scheduled exports and Git commits
- **Web UI** - Visual configuration editor

## 🎛️ Example Use Cases

### Version Control Your Lighting
```bash
# Export current state
npm run export-config

# Commit to Git
git add config/
git commit -m "Added new bedroom lighting scene"
git push
```

### Regular Backups
```bash
# Creates timestamped backup automatically
npm run export-config
# → backups/backup-v2-2025-06-21T15-30-45-123Z/
```

### Compare Configurations
```bash
# See what changed
git diff config/scenes-v2.json
```

## 🏡 Your Specific Lighting Setup

Based on the exported data, your home includes:

**Rooms:**
- Doug's Room (3 lights: Doug Lamp, Desk Lamp, Light Strip)
- Kitchen (2 lights: Kitchen Main, Stove light)  
- Salon/Living Room (3 lights: Desk Lamp, Floor Lamp, Living room main)
- Bathroom (2 lights: bathroom lamp, bathroom main)
- Sandy's Bedroom (3 lights: Reading lamp, Bedroom Lightstrip, Overhead Lamp)
- Hallway (1 light: Overhead Lamp)

**Control Devices:**
- 4x Hue Dimmer Switches (various rooms)
- 1x Hue Tap Switch
- Motion sensors and automation rules

**Scene Collection:**
- Standard scenes: Relax, Read, Concentrate, Energize, Nightlight
- Custom scenes: Galaxy, Soho, Fairfax, Malibu pink, Candles
- Room-specific scenes for different moods

## 🔗 Dependencies

```json
{
  "axios": "^1.6.0",           // HTTP requests
  "chalk": "^4.1.2",           // Colored terminal output  
  "dotenv": "^16.3.1",         // Environment variables
  "inquirer": "^8.2.6",        // Interactive prompts
  "ts-node": "^10.9.0",        // TypeScript execution
  "typescript": "^5.2.0"       // TypeScript compiler
}
```

---

**🎉 Your Philips Hue system is now fully manageable as code!**

For questions or issues, check the terminal output or examine the generated JSON files in the `config/` directory.
