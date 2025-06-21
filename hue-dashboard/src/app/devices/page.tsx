import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

interface HueDevice {
  id: string;
  name: string;
  archetype: string;
  product_data: {
    model_id: string;
    manufacturer_name: string;
    product_name: string;
    product_archetype: string;
    software_version?: string;
    hardware_platform_type?: string;
  };
  services: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

async function loadDevices(): Promise<Record<string, HueDevice>> {
  try {
    const filePath = path.join(process.cwd(), 'public/config/devices-v2.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.data || {};
  } catch (error) {
    console.error('Error loading devices:', error);
    return {};
  }
}

export default async function DevicesPage() {
  const devices = await loadDevices();

  const getDeviceIcon = (device: HueDevice): string => {
    const archetype = device.archetype?.toLowerCase() || '';
    const productName = device.product_data?.product_name?.toLowerCase() || '';

    if (archetype.includes('bridge') || productName.includes('bridge'))
      return '🌉';
    if (archetype.includes('button') || productName.includes('button'))
      return '🔘';
    if (archetype.includes('dimmer') || productName.includes('dimmer'))
      return '🎛️';
    if (archetype.includes('motion') || productName.includes('motion'))
      return '🏃';
    if (archetype.includes('switch') || productName.includes('switch'))
      return '🔄';
    if (archetype.includes('sensor') || productName.includes('sensor'))
      return '📡';
    if (archetype.includes('light') || productName.includes('light'))
      return '💡';
    if (archetype.includes('strip') || productName.includes('strip'))
      return '📏';
    if (archetype.includes('bulb') || productName.includes('bulb')) return '💡';

    return '📱';
  };

  const devicesList = Object.entries(devices);

  return (
    <div className="devices-page">
      <div className="header">
        <h1>📱 Devices</h1>
        <p>Manage your Philips Hue devices</p>
      </div>

      <div className="devices-grid">
        {devicesList.map(([id, device]) => (
          <Link key={id} href={`/devices/${id}`} className="device-card">
            <div className="device-icon">{getDeviceIcon(device)}</div>
            <div className="device-info">
              <h3 className="device-name">{device.name}</h3>
              <p className="device-product">
                {device.product_data?.product_name || device.archetype}
              </p>
              <p className="device-manufacturer">
                {device.product_data?.manufacturer_name}
              </p>
              <p className="device-services">
                {device.services?.length || 0} services
              </p>
            </div>
            <div className="device-info-secondary">
              <div className="device-version">
                {device.product_data?.software_version && (
                  <span>v{device.product_data.software_version}</span>
                )}
              </div>
              <div className="device-arrow">→</div>
            </div>
          </Link>
        ))}
      </div>

      {devicesList.length === 0 && (
        <div className="empty-state">
          <p>
            No devices found. Make sure your bridge is connected and configured.
          </p>
        </div>
      )}
    </div>
  );
}
