#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import { HueBridgeDiscovery } from './discover-bridge';

interface ApiKeyResponse {
  success?: {
    username: string;
  };
  error?: {
    type: number;
    address: string;
    description: string;
  };
}

class HueApiKeyManager {
  private appName = 'hue-config-manager';

  async getApiKey(bridgeIp: string): Promise<string | null> {
    console.log(chalk.blue('🔐 Getting API key from Hue bridge...'));
    console.log(
      chalk.yellow(
        '⚠️  Please press the physical button on your Hue bridge NOW!'
      )
    );
    console.log(chalk.gray('You have 30 seconds after pressing the button...'));

    // Wait for user to confirm they pressed the button
    await inquirer.prompt([
      {
        type: 'input',
        name: 'confirm',
        message: 'Press Enter after you have pressed the bridge button...',
      },
    ]);

    const maxAttempts = 30; // Try for 30 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(chalk.gray(`Attempt ${attempt}/${maxAttempts}...`));

        const response = await axios.post<ApiKeyResponse[]>(
          `http://${bridgeIp}/api`,
          {
            devicetype: this.appName,
            generateclientkey: true,
          },
          { timeout: 2000 }
        );

        if (response.data && response.data[0]) {
          const result = response.data[0];

          if (result.success) {
            console.log(chalk.green('✅ Successfully obtained API key!'));
            return result.success.username;
          }

          if (result.error) {
            if (result.error.type === 101) {
              console.log(chalk.yellow('⏳ Waiting for button press...'));
              await this.sleep(1000);
              continue;
            } else {
              console.error(chalk.red(`❌ Error: ${result.error.description}`));
              return null;
            }
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Request failed:`, error));
        return null;
      }
    }

    console.log(
      chalk.red('❌ Timeout: Button was not pressed within 30 seconds.')
    );
    console.log(
      chalk.yellow(
        'Please try again and make sure to press the button on your bridge.'
      )
    );
    return null;
  }

  async saveConfig(bridgeIp: string, apiKey: string): Promise<void> {
    const config = {
      HUE_BRIDGE_IP: bridgeIp,
      HUE_API_KEY: apiKey,
      HUE_APP_NAME: this.appName,
    };

    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync('.env', envContent);
    console.log(chalk.green('💾 Configuration saved to .env file'));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main() {
  const discovery = new HueBridgeDiscovery();
  const apiManager = new HueApiKeyManager();

  // Check if we already have a saved IP, otherwise discover
  let bridgeIp = process.env.HUE_BRIDGE_IP;

  if (!bridgeIp) {
    console.log(chalk.blue('🔍 No bridge IP found, discovering bridges...'));
    const bridges = await discovery.discoverBridges();

    if (bridges.length === 0) {
      console.log(
        chalk.red(
          '❌ No bridges found. Please run "npm run discover-bridge" first.'
        )
      );
      process.exit(1);
    }

    // If multiple bridges, let user choose
    if (bridges.length > 1) {
      const { selectedBridge } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedBridge',
          message: 'Multiple bridges found. Please select one:',
          choices: bridges.map((b) => ({
            name: `${b.ip} (${b.id})`,
            value: b.ip,
          })),
        },
      ]);
      bridgeIp = selectedBridge;
    } else {
      bridgeIp = bridges[0].ip;
    }
  }

  if (!bridgeIp) {
    console.log(chalk.red('❌ No bridge IP available.'));
    process.exit(1);
  }

  console.log(chalk.cyan(`🌉 Using bridge: ${bridgeIp}`));

  // Validate bridge is accessible
  const isValid = await discovery.validateBridge(bridgeIp);
  if (!isValid) {
    console.log(chalk.red(`❌ Cannot connect to bridge at ${bridgeIp}`));
    console.log(
      chalk.yellow(
        'Please check the IP address and ensure the bridge is online.'
      )
    );
    process.exit(1);
  }

  // Get API key
  const apiKey = await apiManager.getApiKey(bridgeIp);

  if (!apiKey) {
    console.log(chalk.red('❌ Failed to obtain API key.'));
    process.exit(1);
  }

  // Save configuration
  await apiManager.saveConfig(bridgeIp, apiKey);

  console.log(chalk.green('\n🎉 Setup complete!'));
  console.log(
    chalk.blue(
      '💡 Next step: Run "npm run export-config" to export your current Hue configuration.'
    )
  );
  console.log(chalk.gray(`API Key: ${apiKey.substring(0, 8)}...`));
}

if (require.main === module) {
  main().catch(console.error);
}

export { HueApiKeyManager };
