import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

interface HueLight {
  id: string;
  name: string;
  state: {
    on: boolean;
    brightness?: number;
    color_temperature?: number;
  };
  archetype: string;
}

async function loadLights(): Promise<Record<string, HueLight>> {
  try {
    const filePath = path.join(process.cwd(), 'public/config/lights-v2.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.data || {};
  } catch (error) {
    console.error('Error loading lights:', error);
    return {};
  }
}

export default async function LightsPage() {
  const lights = await loadLights();

  const getLightColor = (light: HueLight) => {
    if (!light.state.on) return '#6b7280';

    if (light.state.color_temperature) {
      const mirek = light.state.color_temperature;
      if (mirek < 200) return '#87ceeb';
      if (mirek < 300) return '#ffffff';
      return '#ffd700';
    }

    return '#fbbf24';
  };

  const lightsList = Object.entries(lights);

  return (
    <div className="lights-page">
      <div className="header">
        <h1>💡 Lights</h1>
        <p>Manage all your Philips Hue lights</p>
      </div>

      <div className="lights-grid">
        {lightsList.map(([id, light]) => (
          <Link key={id} href={`/lights/${id}`} className="light-card">
            <div
              className="light-icon"
              style={{ backgroundColor: getLightColor(light) }}
            >
              💡
            </div>
            <div className="light-info">
              <h3 className="light-name">{light.name}</h3>
              <p className="light-status">
                {light.state.on ? 'On' : 'Off'}
                {light.state.on &&
                  light.state.brightness &&
                  ` • ${Math.round((light.state.brightness / 254) * 100)}%`}
              </p>
              <p className="light-type">{light.archetype}</p>
            </div>
            <div className="light-toggle">
              <div className={`toggle ${light.state.on ? 'on' : 'off'}`}>
                <div className="toggle-indicator"></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {lightsList.length === 0 && (
        <div className="empty-state">
          <p>
            No lights found. Make sure your bridge is connected and configured.
          </p>
        </div>
      )}
    </div>
  );
}
