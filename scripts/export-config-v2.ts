#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as https from 'https';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create axios instance that ignores self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface HueV2Response<T> {
  errors: any[];
  data: T[];
}

interface HueV2Light {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    archetype: string;
    function?: string;
  };
  on: {
    on: boolean;
  };
  dimming?: {
    brightness: number;
    min_dim_level?: number;
  };
  color_temperature?: {
    mirek: number;
    mirek_valid: boolean;
    mirek_schema: {
      mirek_minimum: number;
      mirek_maximum: number;
    };
  };
  color?: {
    xy: {
      x: number;
      y: number;
    };
    gamut?: any;
    gamut_type?: string;
  };
  dynamics?: any;
  alert?: any;
  signaling?: any;
  mode?: string;
  effects?: any;
  type: string;
  owner?: any;
  product_data?: any;
}

interface HueV2Room {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    archetype: string;
  };
  children: Array<{
    rid: string;
    rtype: string;
  }>;
  services: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

interface HueV2Scene {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    image?: {
      rid: string;
      rtype: string;
    };
  };
  group?: {
    rid: string;
    rtype: string;
  };
  actions: Array<{
    target: {
      rid: string;
      rtype: string;
    };
    action: any;
  }>;
  speed?: number;
  auto_dynamic?: boolean;
  type: string;
  status?: any;
}

interface HueV2Device {
  id: string;
  id_v1?: string;
  metadata: {
    name: string;
    archetype: string;
  };
  product_data: {
    model_id: string;
    manufacturer_name: string;
    product_name: string;
    product_archetype: string;
    certified: boolean;
    software_version: string;
    hardware_platform_type?: string;
  };
  services: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

class HueConfigExporterV2 {
  private bridgeIp: string;
  private apiKey: string;

  constructor(bridgeIp: string, apiKey: string) {
    this.bridgeIp = bridgeIp;
    this.apiKey = apiKey;
  }

  private async apiRequest<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await axios.get<HueV2Response<T>>(
        `https://${this.bridgeIp}/clip/v2/resource/${endpoint}`,
        {
          headers: {
            'hue-application-key': this.apiKey,
          },
          httpsAgent,
          timeout: 10000,
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        console.error(chalk.red('API Errors:'), response.data.errors);
        return [];
      }

      return response.data.data || [];
    } catch (error) {
      console.error(chalk.red(`❌ Failed to fetch ${endpoint}:`), error);
      return [];
    }
  }

  async exportLights(): Promise<void> {
    console.log(chalk.blue('💡 Exporting lights (API v2)...'));
    const lights = await this.apiRequest<HueV2Light>('light');

    if (lights.length > 0) {
      const lightsConfig = {
        lights: lights.reduce((acc, light) => {
          acc[light.id] = {
            id: light.id,
            id_v1: light.id_v1,
            name: light.metadata.name,
            archetype: light.metadata.archetype,
            function: light.metadata.function,
            state: {
              on: light.on.on,
              brightness: light.dimming?.brightness || null,
              color_temperature: light.color_temperature?.mirek || null,
              color_xy: light.color
                ? { x: light.color.xy.x, y: light.color.xy.y }
                : null,
            },
            capabilities: {
              dimming: light.dimming || null,
              color_temperature: light.color_temperature || null,
              color: light.color || null,
            },
            type: light.type,
            mode: light.mode,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/lights-v2.json',
        JSON.stringify(lightsConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${lights.length} lights to config/lights-v2.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No lights found'));
    }
  }

  async exportRooms(): Promise<void> {
    console.log(chalk.blue('🏠 Exporting rooms (API v2)...'));
    const rooms = await this.apiRequest<HueV2Room>('room');

    if (rooms.length > 0) {
      const roomsConfig = {
        rooms: rooms.reduce((acc, room) => {
          acc[room.id] = {
            id: room.id,
            id_v1: room.id_v1,
            name: room.metadata.name,
            archetype: room.metadata.archetype,
            children: room.children,
            services: room.services,
            type: room.type,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/rooms-v2.json',
        JSON.stringify(roomsConfig, null, 2)
      );
      console.log(
        chalk.green(`✅ Exported ${rooms.length} rooms to config/rooms-v2.json`)
      );
    } else {
      console.log(chalk.yellow('⚠️  No rooms found'));
    }
  }

  async exportScenes(): Promise<void> {
    console.log(chalk.blue('🎭 Exporting scenes (API v2)...'));
    const scenes = await this.apiRequest<HueV2Scene>('scene');

    if (scenes.length > 0) {
      const scenesConfig = {
        scenes: scenes.reduce((acc, scene) => {
          acc[scene.id] = {
            id: scene.id,
            id_v1: scene.id_v1,
            name: scene.metadata.name,
            image: scene.metadata.image,
            group: scene.group,
            actions: scene.actions,
            speed: scene.speed,
            auto_dynamic: scene.auto_dynamic,
            type: scene.type,
            status: scene.status,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/scenes-v2.json',
        JSON.stringify(scenesConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${scenes.length} scenes to config/scenes-v2.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No scenes found'));
    }
  }

  async exportDevices(): Promise<void> {
    console.log(chalk.blue('🔧 Exporting devices (API v2)...'));
    const devices = await this.apiRequest<HueV2Device>('device');

    if (devices.length > 0) {
      const devicesConfig = {
        devices: devices.reduce((acc, device) => {
          acc[device.id] = {
            id: device.id,
            id_v1: device.id_v1,
            name: device.metadata.name,
            archetype: device.metadata.archetype,
            product_data: device.product_data,
            services: device.services,
            type: device.type,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/devices-v2.json',
        JSON.stringify(devicesConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${devices.length} devices to config/devices-v2.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No devices found'));
    }
  }

  async exportAll(): Promise<void> {
    // Ensure config directory exists
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config');
    }

    console.log(
      chalk.cyan(
        `🌉 Fetching configuration from bridge using API v2 (HTTPS)...`
      )
    );

    // Export different categories
    await this.exportLights();
    await this.exportRooms();
    await this.exportScenes();
    await this.exportDevices();

    // Create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/backup-v2-${timestamp}`;

    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    fs.mkdirSync(backupDir);

    // Copy config files to backup
    const configFiles = [
      'lights-v2.json',
      'rooms-v2.json',
      'scenes-v2.json',
      'devices-v2.json',
    ];
    for (const file of configFiles) {
      if (fs.existsSync(`config/${file}`)) {
        fs.copyFileSync(`config/${file}`, `${backupDir}/${file}`);
      }
    }

    console.log(
      chalk.green(`\n🎉 V2 Export complete! Backup saved to ${backupDir}`)
    );
  }
}

async function main() {
  const bridgeIp = process.env.HUE_BRIDGE_IP;
  const apiKey = process.env.HUE_API_KEY;

  if (!bridgeIp || !apiKey) {
    console.log(chalk.red('❌ Missing bridge IP or API key'));
    console.log(
      chalk.yellow(
        'Please run "npm run get-api-key" first to set up authentication'
      )
    );
    process.exit(1);
  }

  console.log(
    chalk.cyan(
      `🌉 Exporting configuration from bridge: ${bridgeIp} (API v2 - HTTPS)`
    )
  );

  const exporter = new HueConfigExporterV2(bridgeIp, apiKey);
  await exporter.exportAll();

  console.log(
    chalk.blue('\n💡 Modern API v2 configuration exported successfully!')
  );
  console.log(chalk.gray('• Better data structure with UUIDs'));
  console.log(chalk.gray('• Richer metadata and capabilities'));
  console.log(chalk.gray('• Future-proof API endpoints'));
}

if (require.main === module) {
  main().catch(console.error);
}

export { HueConfigExporterV2 };
