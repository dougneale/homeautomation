'use client';

import { useState, useEffect } from 'react';
import { getLightColor, getBrightnessPercentage } from '../utils/colorUtils';

// Simplified types for the dashboard
interface Light {
  id: string;
  name: string;
  archetype: string;
  state: {
    on: boolean;
    brightness: number | null;
    color_temperature: number | null;
    color_xy: { x: number; y: number } | null;
  };
  capabilities: any;
}

interface Room {
  id: string;
  name: string;
  archetype: string;
  children: Array<{ rid: string; rtype: string }>;
}

interface Scene {
  id: string;
  name: string;
  group?: { rid: string; rtype: string };
  actions: any[];
}

export default function Dashboard() {
  const [lights, setLights] = useState<Record<string, any>>({});
  const [rooms, setRooms] = useState<Record<string, any>>({});
  const [scenes, setScenes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading Hue data...');

        // Load configuration data
        const [lightsRes, roomsRes, scenesRes] = await Promise.all([
          fetch('/config/lights-v2.json').then((r) => r.json()),
          fetch('/config/rooms-v2.json').then((r) => r.json()),
          fetch('/config/scenes-v2.json').then((r) => r.json()),
        ]);

        console.log('Data loaded:', { lightsRes, roomsRes, scenesRes });

        setLights(lightsRes.lights || {});
        setRooms(roomsRes.rooms || {});
        setScenes(scenesRes.scenes || {});
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get lights for a room
  const getLightsForRoom = (roomId: string): Light[] => {
    const room = rooms[roomId];
    if (!room) return [];

    return room.children
      .filter((child) => child.rtype === 'light')
      .map((child) => lights[child.rid])
      .filter(Boolean);
  };

  // Get scenes for a room
  const getScenesForRoom = (roomId: string): Scene[] => {
    return Object.values(scenes).filter((scene) => scene.group?.rid === roomId);
  };

  // Light icon mapping
  const getLightIcon = (archetype: string) => {
    switch (archetype) {
      case 'pendant_round':
      case 'pendant_spot':
        return '💡';
      case 'table_shade':
        return '🏮';
      case 'flexible_lamp':
        return '🔦';
      case 'hue_lightstrip':
        return '🌈';
      case 'floor_shade':
        return '🕯️';
      case 'ceiling_round':
        return '☀️';
      case 'wall_lantern':
        return '🔆';
      default:
        return '💡';
    }
  };

  // Room icon mapping
  const getRoomIcon = (archetype: string) => {
    switch (archetype) {
      case 'bedroom':
        return '🛏️';
      case 'kitchen':
        return '🍳';
      case 'living_room':
        return '🛋️';
      case 'bathroom':
        return '🚿';
      case 'hallway':
        return '🚪';
      default:
        return '🏠';
    }
  };

  // Helper function to get RGB color from XY coordinates
  const xyToRgb = (x: number, y: number, brightness: number = 100) => {
    const z = 1.0 - x - y;
    const Y = brightness / 100.0;
    const X = (Y / y) * x;
    const Z = (Y / y) * z;

    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

    r = Math.max(0, Math.min(255, Math.round(r * 255)));
    g = Math.max(0, Math.min(255, Math.round(g * 255)));
    b = Math.max(0, Math.min(255, Math.round(b * 255)));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Helper function to get color from scene action
  const getSceneActionColor = (action: any) => {
    if (action.action?.color?.xy) {
      const brightness = action.action?.dimming?.brightness || 100;
      return xyToRgb(
        action.action.color.xy.x,
        action.action.color.xy.y,
        brightness
      );
    }
    if (action.action?.color_temperature?.mirek) {
      const kelvin = 1000000 / action.action.color_temperature.mirek;
      if (kelvin < 3000) return '#ffb366';
      if (kelvin > 5000) return '#b3d9ff';
      return '#fff3e6';
    }
    return '#f3f4f6';
  };

  // Helper function to get light color
  const getLightColor = (light: any) => {
    if (!light.state.on) return '#374151';

    if (light.state.color_xy) {
      return xyToRgb(
        light.state.color_xy.x,
        light.state.color_xy.y,
        light.state.brightness || 100
      );
    }

    if (light.state.color_temperature) {
      const kelvin = 1000000 / light.state.color_temperature;
      if (kelvin < 3000) return '#ffb366';
      if (kelvin > 5000) return '#b3d9ff';
      return '#fff3e6';
    }

    return '#fff3e6';
  };

  // Helper function to get scene type emoji
  const getSceneEmoji = (sceneName: string) => {
    const name = sceneName.toLowerCase();
    if (name.includes('galaxy') || name.includes('cosmic')) return '🌌';
    if (name.includes('candle') || name.includes('fire')) return '🕯️';
    if (name.includes('bright') || name.includes('energize')) return '☀️';
    if (name.includes('relax') || name.includes('chill')) return '🧘';
    if (name.includes('night') || name.includes('dim')) return '🌙';
    if (name.includes('read')) return '📚';
    if (name.includes('concentrate')) return '🎯';
    if (name.includes('party') || name.includes('drugs')) return '🎉';
    if (name.includes('autumn') || name.includes('gold')) return '🍂';
    if (name.includes('blue') || name.includes('ocean')) return '🌊';
    if (name.includes('pink') || name.includes('malibu')) return '🌺';
    if (name.includes('fairfax') || name.includes('soho')) return '🏙️';
    return '🎨';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Hue Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Error Loading Dashboard
          </h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏡 Philips Hue Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            {Object.keys(lights).length} lights • {Object.keys(rooms).length}{' '}
            rooms • {Object.keys(scenes).length} scenes
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">💡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Smart Lights
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(lights).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">🏠</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(rooms).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">🎭</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Scenes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(scenes).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Room Details */}
          {Object.entries(rooms).map(([roomId, room]: [string, any]) => {
            const roomLights = Object.values(lights).filter((light: any) =>
              room.children?.some(
                (child: any) =>
                  child.rid === light.id && child.rtype === 'light'
              )
            );
            const roomScenes = Object.values(scenes).filter(
              (scene: any) => scene.group?.rid === roomId
            );

            return (
              <div
                key={roomId}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                  <p className="text-blue-100 capitalize">
                    {room.archetype?.replace('_', ' ')}
                  </p>
                </div>

                <div className="p-6">
                  {/* Lights */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💡 Lights ({roomLights.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roomLights.map((light: any) => (
                        <div
                          key={light.id}
                          className="bg-gray-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {light.name}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                light.state.on
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {light.state.on ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: getLightColor(light) }}
                            />
                            <span className="text-sm text-gray-600">
                              {light.state.brightness || 0}% brightness
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {light.archetype?.replace('_', ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scenes with Enhanced Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🎭 Scenes ({roomScenes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roomScenes.map((scene: any) => {
                        const affectedLights =
                          scene.actions?.filter(
                            (action: any) => action.target?.rtype === 'light'
                          ) || [];

                        return (
                          <div
                            key={scene.id}
                            className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">
                                  {getSceneEmoji(scene.name)}
                                </span>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {scene.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {affectedLights.length} light
                                    {affectedLights.length !== 1
                                      ? 's'
                                      : ''}{' '}
                                    affected
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Scene Color Preview */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">
                                Scene Colors:
                              </p>
                              <div className="flex space-x-1">
                                {affectedLights
                                  .slice(0, 5)
                                  .map((action: any, index: number) => (
                                    <div
                                      key={index}
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          getSceneActionColor(action),
                                      }}
                                      title={`Light ${index + 1}: ${
                                        action.action?.dimming?.brightness ||
                                        100
                                      }% brightness`}
                                    />
                                  ))}
                                {affectedLights.length > 5 && (
                                  <div className="text-xs text-gray-400 ml-1">
                                    +{affectedLights.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Scene Actions Summary */}
                            <div className="text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>
                                  Actions: {scene.actions?.length || 0}
                                </span>
                                {scene.speed && (
                                  <span>Speed: {scene.speed}</span>
                                )}
                              </div>
                              {scene.auto_dynamic && (
                                <div className="text-purple-600 mt-1">
                                  ✨ Dynamic scene
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Global Scenes */}
          {(() => {
            const globalScenes = Object.values(scenes).filter(
              (scene: any) => !scene.group
            );
            return globalScenes.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">
                    🌟 Global Scenes
                  </h2>
                  <p className="text-purple-100">
                    Scenes that affect multiple rooms
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalScenes.map((scene: any) => {
                      const affectedLights =
                        scene.actions?.filter(
                          (action: any) => action.target?.rtype === 'light'
                        ) || [];

                      return (
                        <div
                          key={scene.id}
                          className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-2xl">
                              {getSceneEmoji(scene.name)}
                            </span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {scene.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {affectedLights.length} light
                                {affectedLights.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex space-x-1 mb-2">
                            {affectedLights
                              .slice(0, 4)
                              .map((action: any, index: number) => (
                                <div
                                  key={index}
                                  className="w-3 h-3 rounded-full border"
                                  style={{
                                    backgroundColor:
                                      getSceneActionColor(action),
                                  }}
                                />
                              ))}
                            {affectedLights.length > 4 && (
                              <div className="text-xs text-gray-400">
                                +{affectedLights.length - 4}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-600">
                            {scene.actions?.length || 0} actions
                            {scene.auto_dynamic && (
                              <span className="text-purple-600 ml-2">
                                ✨ Dynamic
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </main>
    </div>
  );
}
