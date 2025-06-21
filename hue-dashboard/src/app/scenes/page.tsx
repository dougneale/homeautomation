import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

interface HueScene {
  id: string;
  name: string;
  group?: {
    rid: string;
    rtype: string;
  };
  actions?: Array<{
    target: {
      rid: string;
      rtype: string;
    };
    action: {
      on?: { on: boolean };
      dimming?: { brightness: number };
      color?: { xy: { x: number; y: number } };
      color_temperature?: { mirek: number };
    };
  }>;
  speed?: number;
  auto_dynamic?: boolean;
  type?: string;
}

async function loadScenes(): Promise<Record<string, HueScene>> {
  try {
    const filePath = path.join(process.cwd(), 'public/config/scenes-v2.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.data || {};
  } catch (error) {
    console.error('Error loading scenes:', error);
    return {};
  }
}

export default async function ScenesPage() {
  const scenes = await loadScenes();

  const getSceneEmoji = (sceneName: string): string => {
    const name = sceneName.toLowerCase();
    if (name.includes('bright') || name.includes('daylight')) return '☀️';
    if (name.includes('dim') || name.includes('sunset')) return '🌅';
    if (name.includes('night') || name.includes('relax')) return '🌙';
    if (name.includes('warm') || name.includes('cozy')) return '🔥';
    if (name.includes('cool') || name.includes('concentrate')) return '❄️';
    if (name.includes('read') || name.includes('study')) return '📚';
    if (name.includes('movie') || name.includes('tv')) return '🎬';
    if (name.includes('dinner') || name.includes('eat')) return '🍽️';
    if (name.includes('party') || name.includes('celebrate')) return '🎉';
    if (name.includes('romantic')) return '💕';
    if (name.includes('sleep') || name.includes('bedtime')) return '😴';
    if (name.includes('wake') || name.includes('morning')) return '🌅';
    return '🎭';
  };

  const getSceneColors = (scene: HueScene): string[] => {
    const colors: string[] = [];

    scene.actions?.forEach((action) => {
      if (action.action.color?.xy) {
        // Convert XY to approximate RGB for display
        colors.push('#fbbf24'); // Default warm color
      } else if (action.action.color_temperature) {
        const mirek = action.action.color_temperature.mirek;
        if (mirek < 200) colors.push('#87ceeb');
        else if (mirek < 300) colors.push('#ffffff');
        else colors.push('#ffd700');
      } else if (action.action.on?.on) {
        colors.push('#fbbf24');
      }
    });

    return colors.length > 0 ? colors.slice(0, 3) : ['#6b7280'];
  };

  const scenesList = Object.entries(scenes);

  return (
    <div className="scenes-page">
      <div className="header">
        <h1>🎭 Scenes</h1>
        <p>Activate preset lighting scenes</p>
      </div>

      <div className="scenes-grid">
        {scenesList.map(([id, scene]) => {
          const colors = getSceneColors(scene);

          return (
            <Link key={id} href={`/scenes/${id}`} className="scene-card">
              <div className="scene-icon">{getSceneEmoji(scene.name)}</div>
              <div className="scene-info">
                <h3 className="scene-name">{scene.name}</h3>
                <p className="scene-actions">
                  {scene.actions?.length || 0} actions
                </p>
                <div className="scene-colors">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="color-dot"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="scene-play">▶️</div>
            </Link>
          );
        })}
      </div>

      {scenesList.length === 0 && (
        <div className="empty-state">
          <p>
            No scenes found. Make sure your bridge is connected and configured.
          </p>
        </div>
      )}
    </div>
  );
}
