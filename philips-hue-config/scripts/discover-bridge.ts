#!/usr/bin/env ts-node

import axios from 'axios';
import chalk from 'chalk';

interface DiscoveryResponse {
  id: string;
  internalipaddress: string;
}

interface HueBridge {
  ip: string;
  id: string;
  internalipaddress: string;
}

class HueBridgeDiscovery {
  async discoverBridges(): Promise<HueBridge[]> {
    console.log(chalk.blue('🔍 Discovering Philips Hue bridges...'));
    
    try {
      console.log(chalk.gray('Trying Philips discovery service...'));
      const response = await axios.get<DiscoveryResponse[]>('https://discovery.meethue.com/', {
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        return response.data.map(bridge => ({
          id: bridge.id,
          ip: bridge.internalipaddress,
          internalipaddress: bridge.internalipaddress
        }));
      }

      console.log(chalk.yellow('No bridges found via discovery service'));
      return [];
    } catch (error) {
      console.error(chalk.red('Error during bridge discovery:'), error);
      return [];
    }
  }

  async validateBridge(ip: string): Promise<boolean> {
    try {
      const response = await axios.get(`http://${ip}/api/0/config`, {
        timeout: 3000
      });
      return response.data && response.data.bridgeid;
    } catch (error) {
      return false;
    }
  }
}

async function main() {
  const discovery = new HueBridgeDiscovery();
  const bridges = await discovery.discoverBridges();

  if (bridges.length === 0) {
    console.log(chalk.red('❌ No Hue bridges found on your network.'));
    console.log(chalk.yellow('Make sure your bridge is:'));
    console.log(chalk.yellow('  • Connected to the same network'));
    console.log(chalk.yellow('  • Powered on'));
    console.log(chalk.yellow('  • Accessible from this device'));
    process.exit(1);
  }

  console.log(chalk.green(`\n🎉 Found ${bridges.length} bridge(s):`));
  
  for (const bridge of bridges) {
    console.log(chalk.cyan(`\n📍 Bridge ID: ${bridge.id}`));
    console.log(chalk.cyan(`   IP Address: ${bridge.ip}`));
    
    const isValid = await discovery.validateBridge(bridge.ip);
    if (isValid) {
      console.log(chalk.green('   Status: ✓ Online and accessible'));
    } else {
      console.log(chalk.red('   Status: ❌ Not accessible'));
    }
  }

  console.log(chalk.blue('\n💡 Next step: Run "npm run get-api-key" to authenticate with your bridge.'));
  console.log(chalk.gray(`💡 You'll need the IP address: ${bridges[0].ip}`));
}

if (require.main === module) {
  main().catch(console.error);
}

export { HueBridgeDiscovery };
