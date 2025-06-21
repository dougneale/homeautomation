#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { HueApiResponse, HueLight, HueRoom, HueScene } from '../src/types/hue';

// Load environment variables
dotenv.config();

class HueConfigExporter {
  private bridgeIp: string;
  private apiKey: string;

  constructor(bridgeIp: string, apiKey: string) {
    this.bridgeIp = bridgeIp;
    this.apiKey = apiKey;
  }

  private async apiRequest<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await axios.get<HueApiResponse<T>>(
        `http://${this.bridgeIp}/clip/v2/resource/${endpoint}`,
        {
          headers: {
            'hue-application-key': this.apiKey,
          },
          timeout: 5000,
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(`API Error: ${response.data.errors[0].description}`);
      }

      return response.data.data || [];
    } catch (error) {
      console.error(chalk.red(`❌ Failed to fetch ${endpoint}:`), error);
      return [];
    }
  }

  async exportLights(): Promise<void> {
    console.log(chalk.blue('💡 Exporting lights...'));
    const lights = await this.apiRequest<HueLight>('light');

    if (lights.length > 0) {
      const lightsConfig = {
        lights: lights.reduce((acc, light) => {
          acc[light.id] = {
            id: light.id,
            name: light.metadata.name,
            type: light.type,
            on: light.on.on,
            brightness: light.dimming?.brightness || null,
            color_temperature: light.color_temperature?.mirek || null,
            color: light.color?.xy || null,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/lights.json',
        JSON.stringify(lightsConfig, null, 2)
      );
      console.log(
        chalk.green(`✅ Exported ${lights.length} lights to config/lights.json`)
      );
    } else {
      console.log(chalk.yellow('⚠️  No lights found'));
    }
  }

  async exportRooms(): Promise<void> {
    console.log(chalk.blue('🏠 Exporting rooms...'));
    const rooms = await this.apiRequest<HueRoom>('room');

    if (rooms.length > 0) {
      const roomsConfig = {
        rooms: rooms.reduce((acc, room) => {
          acc[room.id] = {
            id: room.id,
            name: room.metadata.name,
            archetype: room.metadata.archetype,
            children: room.children,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/rooms.json',
        JSON.stringify(roomsConfig, null, 2)
      );
      console.log(
        chalk.green(`✅ Exported ${rooms.length} rooms to config/rooms.json`)
      );
    } else {
      console.log(chalk.yellow('⚠️  No rooms found'));
    }
  }

  async exportScenes(): Promise<void> {
    console.log(chalk.blue('🎭 Exporting scenes...'));
    const scenes = await this.apiRequest<HueScene>('scene');

    if (scenes.length > 0) {
      const scenesConfig = {
        scenes: scenes.reduce((acc, scene) => {
          acc[scene.id] = {
            id: scene.id,
            name: scene.metadata.name,
            group: scene.group,
            actions: scene.actions,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/scenes.json',
        JSON.stringify(scenesConfig, null, 2)
      );
      console.log(
        chalk.green(`✅ Exported ${scenes.length} scenes to config/scenes.json`)
      );
    } else {
      console.log(chalk.yellow('⚠️  No scenes found'));
    }
  }

  async exportAll(): Promise<void> {
    // Ensure config directory exists
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config');
    }

    await this.exportLights();
    await this.exportRooms();
    await this.exportScenes();

    // Create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/backup-${timestamp}`;

    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    fs.mkdirSync(backupDir);

    // Copy config files to backup
    if (fs.existsSync('config/lights.json')) {
      fs.copyFileSync('config/lights.json', `${backupDir}/lights.json`);
    }
    if (fs.existsSync('config/rooms.json')) {
      fs.copyFileSync('config/rooms.json', `${backupDir}/rooms.json`);
    }
    if (fs.existsSync('config/scenes.json')) {
      fs.copyFileSync('config/scenes.json', `${backupDir}/scenes.json`);
    }

    console.log(
      chalk.green(`\n🎉 Export complete! Backup saved to ${backupDir}`)
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
    chalk.cyan(`🌉 Exporting configuration from bridge: ${bridgeIp}`)
  );

  const exporter = new HueConfigExporter(bridgeIp, apiKey);
  await exporter.exportAll();

  console.log(chalk.blue('\n💡 Configuration exported successfully!'));
  console.log(
    chalk.gray('You can now edit the JSON files in the config/ directory')
  );
  console.log(
    chalk.gray('Use version control to track changes to your lighting setup')
  );
}

if (require.main === module) {
  main().catch(console.error);
}

export { HueConfigExporter };
