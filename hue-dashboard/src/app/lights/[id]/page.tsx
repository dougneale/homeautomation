'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HueLight {
  id: string;
  id_v1?: string;
  name: string;
  archetype: string;
  function: string;
  state: {
    on: boolean;
    brightness?: number;
    color_temperature?: number;
    color_xy?: {
      x: number;
      y: number;
    };
  };
  capabilities: {
    dimming?: {
      brightness: number;
      min_dim_level: number;
    };
    color_temperature?: {
      mirek?: number;
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
      gamut: {
        red: { x: number; y: number };
        green: { x: number; y: number };
        blue: { x: number; y: number };
      };
      gamut_type: string;
    };
  };
  type: string;
  mode: string;
}

export default function LightDetail() {
  const params = useParams();
  const lightId = params.id as string;
  const [light, setLight] = useState<HueLight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLight = async () => {
    try {
      const response = await fetch('/config/lights-v2.json');
      const data = await response.json();

      const foundLight = data.lights[lightId];
      if (foundLight) {
        setLight(foundLight);
      } else {
        setError('Light not found');
      }
    } catch (err) {
      setError('Failed to load light data');
      console.error('Error loading light:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLight();
  }, [lightId]);

  const getLightColor = (light: HueLight) => {
    if (light.state.color_xy) {
      // Convert xy to RGB (simplified)
      const x = light.state.color_xy.x;
      const y = light.state.color_xy.y;
      const z = 1 - x - y;

      // Convert to RGB (simplified approximation)
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
    }
    return '#fbbf24'; // Default warm white
  };

  const formatTemperature = (mirek?: number) => {
    if (!mirek) return 'N/A';
    const kelvin = Math.round(1000000 / mirek);
    return `${kelvin}K`;
  };

  const getArchetypeIcon = (archetype: string) => {
    const icons: { [key: string]: string } = {
      table_shade: '🛋️',
      hue_lightstrip: '💡',
      flexible_lamp: '🔦',
      pendant_round: '💡',
      ceiling_round: '🔆',
      wall_lantern: '🏮',
      recessed_ceiling: '💡',
      recessed_floor: '🔅',
      single_spot: '🔦',
      double_spot: '🔦',
      table_wash: '🛋️',
      wall_wash: '🏮',
      luster: '✨',
      pendants: '💡',
      floor_shade: '🏮',
      desk: '🪑',
      wall_shade: '🏮',
    };
    return icons[archetype] || '💡';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p>Loading light details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !light) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <p className="text-red-400 mb-4">{error || 'Light not found'}</p>
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
            {getArchetypeIcon(light.archetype)} {light.name}
          </h1>
          <p className="text-purple-300 text-lg capitalize">
            {light.archetype.replace('_', ' ')}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  light.state.on ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                {light.state.on ? '🟢' : '⚫'}
              </div>
              <p className="text-white font-medium">
                {light.state.on ? 'On' : 'Off'}
              </p>
            </div>

            {light.state.brightness !== undefined && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-yellow-500">
                  🔆
                </div>
                <p className="text-white font-medium">
                  {Math.round(light.state.brightness)}%
                </p>
                <p className="text-purple-300 text-sm">Brightness</p>
              </div>
            )}

            {light.state.color_temperature && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-500">
                  🌡️
                </div>
                <p className="text-white font-medium">
                  {formatTemperature(light.state.color_temperature)}
                </p>
                <p className="text-purple-300 text-sm">Color Temperature</p>
              </div>
            )}
          </div>
        </div>

        {/* Color Preview */}
        {light.state.color_xy && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Current Color
            </h2>
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-full border-4 border-white/30"
                style={{ backgroundColor: getLightColor(light) }}
              ></div>
              <div className="text-white">
                <p>
                  <strong>XY:</strong> ({light.state.color_xy.x.toFixed(3)},{' '}
                  {light.state.color_xy.y.toFixed(3)})
                </p>
                <p>
                  <strong>RGB:</strong> {getLightColor(light)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Technical Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Basic Info</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>ID:</strong> {light.id}
                </li>
                {light.id_v1 && (
                  <li>
                    <strong>Legacy ID:</strong> {light.id_v1}
                  </li>
                )}
                <li>
                  <strong>Type:</strong> {light.type}
                </li>
                <li>
                  <strong>Function:</strong> {light.function}
                </li>
                <li>
                  <strong>Mode:</strong> {light.mode}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-300 mb-2">
                Capabilities
              </h3>
              <ul className="space-y-1 text-sm">
                {light.capabilities.dimming && (
                  <li>
                    <strong>Dimming:</strong>{' '}
                    {light.capabilities.dimming.min_dim_level * 100}% - 100%
                  </li>
                )}
                {light.capabilities.color_temperature && (
                  <li>
                    <strong>Color Temp:</strong>{' '}
                    {formatTemperature(
                      light.capabilities.color_temperature.mirek_schema
                        .mirek_minimum
                    )}{' '}
                    -{' '}
                    {formatTemperature(
                      light.capabilities.color_temperature.mirek_schema
                        .mirek_maximum
                    )}
                  </li>
                )}
                {light.capabilities.color && (
                  <li>
                    <strong>Color Gamut:</strong> Type{' '}
                    {light.capabilities.color.gamut_type}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Color Gamut Visualization */}
        {light.capabilities.color && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Color Gamut</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-sm">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <h4 className="font-semibold text-red-300 mb-1">Red Point</h4>
                <p>x: {light.capabilities.color.gamut.red.x}</p>
                <p>y: {light.capabilities.color.gamut.red.y}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <h4 className="font-semibold text-green-300 mb-1">
                  Green Point
                </h4>
                <p>x: {light.capabilities.color.gamut.green.x}</p>
                <p>y: {light.capabilities.color.gamut.green.y}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-1">Blue Point</h4>
                <p>x: {light.capabilities.color.gamut.blue.x}</p>
                <p>y: {light.capabilities.color.gamut.blue.y}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
