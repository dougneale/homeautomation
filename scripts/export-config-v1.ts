#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface HueV1Light {
  state: {
    on: boolean;
    bri?: number;
    hue?: number;
    sat?: number;
    xy?: [number, number];
    ct?: number;
    colormode?: string;
    reachable: boolean;
  };
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname?: string;
  uniqueid: string;
  swversion: string;
}

interface HueV1Group {
  name: string;
  lights: string[];
  type: string;
  state: {
    all_on: boolean;
    any_on: boolean;
  };
  recycle: boolean;
  class?: string;
  action: any;
}

interface HueV1Scene {
  name: string;
  type: string;
  group?: string;
  lights: string[];
  owner: string;
  recycle: boolean;
  locked: boolean;
  appdata?: any;
  picture?: string;
  image?: string;
  lastupdated: string;
  version: number;
}

interface HueV1Config {
  lights: Record<string, HueV1Light>;
  groups: Record<string, HueV1Group>;
  scenes: Record<string, HueV1Scene>;
  config: any;
  schedules: any;
  sensors: any;
  rules: any;
  resourcelinks: any;
}

class HueConfigExporterV1 {
  private bridgeIp: string;
  private apiKey: string;

  constructor(bridgeIp: string, apiKey: string) {
    this.bridgeIp = bridgeIp;
    this.apiKey = apiKey;
  }

  private async getFullConfig(): Promise<HueV1Config | null> {
    try {
      const response = await axios.get<HueV1Config>(
        `http://${this.bridgeIp}/api/${this.apiKey}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch configuration:'), error);
      return null;
    }
  }

  async exportLights(config: HueV1Config): Promise<void> {
    console.log(chalk.blue('💡 Exporting lights...'));
    const lights = config.lights;

    if (Object.keys(lights).length > 0) {
      const lightsConfig = {
        lights: Object.entries(lights).reduce((acc, [id, light]) => {
          acc[id] = {
            id,
            name: light.name,
            type: light.type,
            modelid: light.modelid,
            manufacturername: light.manufacturername,
            productname: light.productname || '',
            state: {
              on: light.state.on,
              brightness: light.state.bri || null,
              hue: light.state.hue || null,
              saturation: light.state.sat || null,
              xy: light.state.xy || null,
              color_temperature: light.state.ct || null,
              colormode: light.state.colormode || null,
              reachable: light.state.reachable,
            },
            uniqueid: light.uniqueid,
            swversion: light.swversion,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/lights.json',
        JSON.stringify(lightsConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${
            Object.keys(lights).length
          } lights to config/lights.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No lights found'));
    }
  }

  async exportRooms(config: HueV1Config): Promise<void> {
    console.log(chalk.blue('🏠 Exporting rooms and groups...'));
    const groups = config.groups;

    if (Object.keys(groups).length > 0) {
      const roomsConfig = {
        rooms: Object.entries(groups).reduce((acc, [id, group]) => {
          acc[id] = {
            id,
            name: group.name,
            type: group.type,
            class: group.class || 'Other',
            lights: group.lights,
            state: group.state,
            recycle: group.recycle,
            action: group.action,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/rooms.json',
        JSON.stringify(roomsConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${
            Object.keys(groups).length
          } rooms/groups to config/rooms.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No rooms/groups found'));
    }
  }

  async exportScenes(config: HueV1Config): Promise<void> {
    console.log(chalk.blue('🎭 Exporting scenes...'));
    const scenes = config.scenes;

    if (Object.keys(scenes).length > 0) {
      const scenesConfig = {
        scenes: Object.entries(scenes).reduce((acc, [id, scene]) => {
          acc[id] = {
            id,
            name: scene.name,
            type: scene.type,
            group: scene.group || '0',
            lights: scene.lights,
            owner: scene.owner,
            recycle: scene.recycle,
            locked: scene.locked,
            appdata: scene.appdata,
            picture: scene.picture || '',
            image: scene.image || '',
            lastupdated: scene.lastupdated,
            version: scene.version,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/scenes.json',
        JSON.stringify(scenesConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${
            Object.keys(scenes).length
          } scenes to config/scenes.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No scenes found'));
    }
  }

  async exportSensors(config: HueV1Config): Promise<void> {
    console.log(chalk.blue('🔍 Exporting sensors...'));
    const sensors = config.sensors;

    if (Object.keys(sensors).length > 0) {
      const sensorsConfig = {
        sensors: Object.entries(sensors).reduce((acc, [id, sensor]) => {
          acc[id] = {
            id,
            ...(sensor as Record<string, any>),
          };
          return acc;
        }, {} as Record<string, any>),
      };

      fs.writeFileSync(
        'config/sensors.json',
        JSON.stringify(sensorsConfig, null, 2)
      );
      console.log(
        chalk.green(
          `✅ Exported ${
            Object.keys(sensors).length
          } sensors to config/sensors.json`
        )
      );
    } else {
      console.log(chalk.yellow('⚠️  No sensors found'));
    }
  }

  async exportAll(): Promise<void> {
    // Ensure config directory exists
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config');
    }

    console.log(
      chalk.cyan(`🌉 Fetching complete configuration from bridge...`)
    );
    const config = await this.getFullConfig();

    if (!config) {
      console.log(chalk.red('❌ Failed to fetch bridge configuration'));
      return;
    }

    // Export different categories
    await this.exportLights(config);
    await this.exportRooms(config);
    await this.exportScenes(config);
    await this.exportSensors(config);

    // Export bridge configuration
    const bridgeConfig = {
      config: config.config,
      schedules: config.schedules,
      rules: config.rules,
      resourcelinks: config.resourcelinks,
    };

    fs.writeFileSync(
      'config/bridge.json',
      JSON.stringify(bridgeConfig, null, 2)
    );
    console.log(
      chalk.green(`✅ Exported bridge configuration to config/bridge.json`)
    );

    // Create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/backup-${timestamp}`;

    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    fs.mkdirSync(backupDir);

    // Copy config files to backup
    const configFiles = [
      'lights.json',
      'rooms.json',
      'scenes.json',
      'sensors.json',
      'bridge.json',
    ];
    for (const file of configFiles) {
      if (fs.existsSync(`config/${file}`)) {
        fs.copyFileSync(`config/${file}`, `${backupDir}/${file}`);
      }
    }

    console.log(
      chalk.green(`\n🎉 Export complete! Backup saved to ${backupDir}`)
    );

    // Display summary
    console.log(chalk.blue('\n📊 Summary:'));
    console.log(chalk.gray(`• ${Object.keys(config.lights).length} lights`));
    console.log(
      chalk.gray(`• ${Object.keys(config.groups).length} rooms/groups`)
    );
    console.log(chalk.gray(`• ${Object.keys(config.scenes).length} scenes`));
    console.log(chalk.gray(`• ${Object.keys(config.sensors).length} sensors`));
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
    chalk.cyan(`🌉 Exporting configuration from bridge: ${bridgeIp} (API v1)`)
  );

  const exporter = new HueConfigExporterV1(bridgeIp, apiKey);
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

export { HueConfigExporterV1 };
