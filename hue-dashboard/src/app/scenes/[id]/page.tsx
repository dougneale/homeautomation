'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HueScene {
  id: string;
  id_v1?: string;
  name: string;
  group?: {
    rid: string;
    rtype: string;
  };
  actions: Array<{
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
  type: string;
  status?: {
    active: string;
    last_recall?: string;
  };
  image?: {
    rid: string;
    rtype: string;
  };
}

interface HueLight {
  id: string;
  name: string;
  archetype: string;
}

interface HueRoom {
  id: string;
  name: string;
  archetype: string;
}

export default function SceneDetail() {
  const params = useParams();
  const sceneId = params.id as string;
  const [scene, setScene] = useState<HueScene | null>(null);
  const [lights, setLights] = useState<Record<string, HueLight>>({});
  const [rooms, setRooms] = useState<Record<string, HueRoom>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSceneData = async () => {
    try {
      const [scenesResponse, lightsResponse, roomsResponse] = await Promise.all(
        [
          fetch('/config/scenes-v2.json'),
          fetch('/config/lights-v2.json'),
          fetch('/config/rooms-v2.json'),
        ]
      );

      const [scenesData, lightsData, roomsData] = await Promise.all([
        scenesResponse.json(),
        lightsResponse.json(),
        roomsResponse.json(),
      ]);

      const foundScene = scenesData.scenes[sceneId];
      if (foundScene) {
        setScene(foundScene);
        setLights(lightsData.lights || {});
        setRooms(roomsData.rooms || {});
      } else {
        setError('Scene not found');
      }
    } catch (err) {
      setError('Failed to load scene data');
      console.error('Error loading scene:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSceneData();
  }, [sceneId]);

  const getSceneEmoji = (sceneName: string): string => {
    const name = sceneName.toLowerCase();
    if (name.includes('relax') || name.includes('chill')) return '😌';
    if (name.includes('energize') || name.includes('energy')) return '⚡';
    if (name.includes('concentrate') || name.includes('focus')) return '🎯';
    if (name.includes('read') || name.includes('study')) return '📚';
    if (name.includes('bright') || name.includes('day')) return '☀️';
    if (name.includes('dimmed') || name.includes('night')) return '🌙';
    if (name.includes('sunset') || name.includes('golden')) return '🌅';
    if (name.includes('cozy') || name.includes('warm')) return '🔥';
    if (name.includes('cool') || name.includes('arctic')) return '❄️';
    if (name.includes('tropical') || name.includes('savanna')) return '🌴';
    if (name.includes('spring') || name.includes('blossom')) return '🌸';
    if (name.includes('movie') || name.includes('cinema')) return '🎬';
    if (name.includes('party') || name.includes('disco')) return '🎉';
    if (name.includes('romantic') || name.includes('love')) return '💕';
    if (name.includes('christmas') || name.includes('holiday')) return '🎄';
    return '🎨';
  };

  const convertXYToRGB = (x: number, y: number) => {
    const z = 1 - x - y;
    const r = Math.round(
      255 * Math.max(0, Math.min(1, 1.656 * x - 0.354 * y - 0.255 * z))
    );
    const g = Math.round(
      255 * Math.max(0, Math.min(1, -0.707 * x + 1.655 * y + 0.036 * z))
    );
    const b = Math.round(
      255 * Math.max(0, Math.min(1, 0.051 * x - 0.121 * y + 1.011 * z))
    );
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatTemperature = (mirek: number) => {
    const kelvin = Math.round(1000000 / mirek);
    return `${kelvin}K`;
  };

  const getSceneRoom = () => {
    if (scene?.group && scene.group.rtype === 'room') {
      return rooms[scene.group.rid];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p>Loading scene details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <p className="text-red-400 mb-4">{error || 'Scene not found'}</p>
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sceneRoom = getSceneRoom();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            {getSceneEmoji(scene.name)} {scene.name}
          </h1>
          {sceneRoom && (
            <p className="text-purple-300 text-lg">
              in{' '}
              <Link
                href={`/rooms/${sceneRoom.id}`}
                className="hover:text-purple-200 underline"
              >
                {sceneRoom.name}
              </Link>
            </p>
          )}
        </div>

        {/* Scene Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Scene Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  scene.status?.active === 'active'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}
              >
                {scene.status?.active === 'active' ? '✅' : '⏸️'}
              </div>
              <p className="text-white font-medium capitalize">
                {scene.status?.active || 'Unknown'}
              </p>
              <p className="text-purple-300 text-sm">Status</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-500">
                💡
              </div>
              <p className="text-white font-medium">{scene.actions.length}</p>
              <p className="text-purple-300 text-sm">Light Actions</p>
            </div>

            {scene.speed && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-500">
                  ⚡
                </div>
                <p className="text-white font-medium">
                  {(scene.speed * 100).toFixed(1)}%
                </p>
                <p className="text-purple-300 text-sm">Speed</p>
              </div>
            )}
          </div>
        </div>

        {/* Scene Actions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Light Actions</h2>
          <div className="space-y-4">
            {scene.actions.map((action, index) => {
              const light = lights[action.target.rid];
              const lightName =
                light?.name || `Light ${action.target.rid.substring(0, 8)}`;

              return (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/lights/${action.target.rid}`}
                      className="text-white font-medium hover:text-purple-300"
                    >
                      💡 {lightName}
                    </Link>
                    <div className="flex items-center gap-2">
                      {action.action.on && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            action.action.on.on
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {action.action.on.on ? 'ON' : 'OFF'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {action.action.dimming && (
                      <div className="bg-yellow-500/10 p-3 rounded-lg">
                        <p className="text-yellow-300 font-medium">
                          Brightness
                        </p>
                        <p className="text-white">
                          {action.action.dimming.brightness.toFixed(1)}%
                        </p>
                      </div>
                    )}

                    {action.action.color_temperature && (
                      <div className="bg-orange-500/10 p-3 rounded-lg">
                        <p className="text-orange-300 font-medium">
                          Color Temperature
                        </p>
                        <p className="text-white">
                          {formatTemperature(
                            action.action.color_temperature.mirek
                          )}
                        </p>
                      </div>
                    )}

                    {action.action.color && (
                      <div className="bg-purple-500/10 p-3 rounded-lg">
                        <p className="text-purple-300 font-medium">Color</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-white/30"
                            style={{
                              backgroundColor: convertXYToRGB(
                                action.action.color.xy.x,
                                action.action.color.xy.y
                              ),
                            }}
                          ></div>
                          <p className="text-white text-xs">
                            ({action.action.color.xy.x.toFixed(3)},{' '}
                            {action.action.color.xy.y.toFixed(3)})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Technical Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Basic Info</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>ID:</strong> {scene.id}
                </li>
                {scene.id_v1 && (
                  <li>
                    <strong>Legacy ID:</strong> {scene.id_v1}
                  </li>
                )}
                <li>
                  <strong>Type:</strong> {scene.type}
                </li>
                <li>
                  <strong>Auto Dynamic:</strong>{' '}
                  {scene.auto_dynamic ? 'Yes' : 'No'}
                </li>
                {scene.status?.last_recall && (
                  <li>
                    <strong>Last Recalled:</strong>{' '}
                    {new Date(scene.status.last_recall).toLocaleString()}
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-300 mb-2">
                Configuration
              </h3>
              <ul className="space-y-1 text-sm">
                {scene.speed && (
                  <li>
                    <strong>Speed:</strong> {scene.speed.toFixed(3)}
                  </li>
                )}
                {scene.group && (
                  <li>
                    <strong>Group:</strong> {scene.group.rtype} (
                    {scene.group.rid.substring(0, 8)}...)
                  </li>
                )}
                {scene.image && (
                  <li>
                    <strong>Image:</strong> {scene.image.rtype} (
                    {scene.image.rid.substring(0, 8)}...)
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
