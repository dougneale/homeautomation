'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

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

interface HueRoom {
  id: string;
  name: string;
  archetype?: string;
  children?: Array<{
    rid: string;
    rtype: string;
  }>;
}

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
  image?: {
    rid: string;
    rtype: string;
  };
}

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

interface SwitchSceneCycle {
  switchId: string;
  switchName: string;
  scenes: {
    id: string;
    name: string;
    order: number;
  }[];
}

// Function to parse switch scene cycling from bridge rules
function parseSwitchSceneCycling(
  bridgeData: { rules?: Record<string, any> },
  scenesV1Data: { scenes?: Record<string, any> }
): SwitchSceneCycle[] {
  const switchCycles: SwitchSceneCycle[] = [];

  if (!bridgeData?.rules || !scenesV1Data?.scenes) {
    return switchCycles;
  }

  // Group rules by switch (looking for rules with scene cycling patterns)
  const switchRuleGroups: { [key: string]: any[] } = {};

  Object.values(bridgeData.rules).forEach((rule: any) => {
    // Look for rules that have scene actions and status conditions
    if (rule.name && rule.actions && rule.conditions) {
      const hasSceneAction = rule.actions.some(
        (action: any) => action.body?.scene
      );

      if (hasSceneAction && rule.name.includes('dimmer switch')) {
        const switchMatch = rule.name.match(/dimmer switch (\d+)/);
        if (switchMatch) {
          const switchId = switchMatch[1];
          if (!switchRuleGroups[switchId]) {
            switchRuleGroups[switchId] = [];
          }
          switchRuleGroups[switchId].push(rule);
        }
      }
    }
  });

  // Process each switch's rules to extract scene cycling
  Object.entries(switchRuleGroups).forEach(([switchId, rules]) => {
    const sceneRules = rules.filter((rule) => {
      const hasSceneAction = rule.actions?.some(
        (action: any) => action.body?.scene
      );
      const hasStatusCondition = rule.conditions?.some(
        (condition: any) =>
          condition.address?.includes('/state/status') &&
          condition.operator === 'eq'
      );
      return hasSceneAction && hasStatusCondition;
    });

    if (sceneRules.length > 0) {
      const scenes: { id: string; name: string; order: number }[] = [];

      sceneRules.forEach((rule) => {
        const sceneAction = rule.actions?.find(
          (action: any) => action.body?.scene
        );
        const statusCondition = rule.conditions?.find(
          (condition: any) =>
            condition.address?.includes('/state/status') &&
            condition.operator === 'eq'
        );

        if (sceneAction && statusCondition) {
          const sceneId = sceneAction.body.scene;
          const statusValue = parseInt(statusCondition.value);
          const sceneName =
            scenesV1Data.scenes?.[sceneId]?.name || 'Unknown Scene';

          scenes.push({
            id: sceneId,
            name: sceneName,
            order: statusValue,
          });
        }
      });

      // Add the "on" scene (when turning on from off)
      const onRule = rules.find(
        (rule) =>
          rule.name.includes('.on') &&
          rule.actions?.some((action: any) => action.body?.scene)
      );

      if (onRule) {
        const sceneAction = onRule.actions.find(
          (action: any) => action.body?.scene
        );
        if (sceneAction) {
          const sceneId = sceneAction.body.scene;
          const sceneName =
            scenesV1Data.scenes?.[sceneId]?.name || 'Unknown Scene';
          scenes.push({
            id: sceneId,
            name: sceneName,
            order: 0, // "on" state is order 0
          });
        }
      }

      if (scenes.length > 0) {
        scenes.sort((a, b) => a.order - b.order);

        switchCycles.push({
          switchId,
          switchName: `Hue dimmer switch ${switchId}`,
          scenes,
        });
      }
    }
  });

  return switchCycles;
}

export default function Dashboard() {
  const [lights, setLights] = useState<Record<string, HueLight>>({});
  const [rooms, setRooms] = useState<Record<string, HueRoom>>({});
  const [scenes, setScenes] = useState<Record<string, HueScene>>({});
  const [devices, setDevices] = useState<Record<string, HueDevice>>({});
  const [bridgeData, setBridgeData] = useState<any>(null);
  const [scenesV1Data, setScenesV1Data] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const switchSceneCycles = useMemo(() => {
    if (bridgeData && scenesV1Data) {
      return parseSwitchSceneCycling(bridgeData, scenesV1Data);
    }
    return [];
  }, [bridgeData, scenesV1Data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading Hue data...');

        const [
          lightsRes,
          roomsRes,
          scenesRes,
          devicesRes,
          bridgeRes,
          scenesV1Res,
        ] = await Promise.all([
          fetch('/config/lights-v2.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load lights: ${r.status}`);
            return r.json();
          }),
          fetch('/config/rooms-v2.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load rooms: ${r.status}`);
            return r.json();
          }),
          fetch('/config/scenes-v2.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load scenes: ${r.status}`);
            return r.json();
          }),
          fetch('/config/devices-v2.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load devices: ${r.status}`);
            return r.json();
          }),
          fetch('/config/bridge.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load bridge: ${r.status}`);
            return r.json();
          }),
          fetch('/config/scenes.json').then((r) => {
            if (!r.ok) throw new Error(`Failed to load v1 scenes: ${r.status}`);
            return r.json();
          }),
        ]);

        console.log('✅ Data loaded successfully');
        console.log('📊 Lights:', Object.keys(lightsRes.lights || {}).length);
        console.log('🏠 Rooms:', Object.keys(roomsRes.rooms || {}).length);
        console.log('🎭 Scenes:', Object.keys(scenesRes.scenes || {}).length);
        console.log(
          '🎛️ Devices:',
          Object.keys(devicesRes.devices || {}).length
        );

        setLights(lightsRes.lights || {});
        setRooms(roomsRes.rooms || {});
        setScenes(scenesRes.scenes || {});
        setDevices(devicesRes.devices || {});
        setBridgeData(bridgeRes);
        setScenesV1Data(scenesV1Res);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to get RGB color from light data
  const getLightColor = (light: HueLight) => {
    if (!light.state.on) return '#374151'; // Gray for off

    // Use color temperature or default warm white
    if (light.state.color_temperature) {
      const kelvin = 1000000 / light.state.color_temperature;
      if (kelvin < 3000) return '#ffb366'; // Warm
      if (kelvin > 5000) return '#b3d9ff'; // Cool
      return '#fff3e6'; // Neutral
    }

    return '#fff3e6'; // Default warm white
  };

  // Helper function to get scene colors from actions
  const getSceneColors = (scene: HueScene): string[] => {
    if (!scene.actions) return [];

    return scene.actions.slice(0, 5).map((action) => {
      if (action.action.color?.xy) {
        // Convert XY to RGB (simplified)
        const { x, y } = action.action.color.xy;
        const z = 1.0 - x - y;
        const Y = (action.action.dimming?.brightness || 100) / 100;
        const X = (Y / y) * x;
        const Z = (Y / y) * z;

        // XYZ to RGB conversion (simplified)
        let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b = Math.max(0, Math.min(1, b));

        return `rgb(${Math.round(r * 255)}, ${Math.round(
          g * 255
        )}, ${Math.round(b * 255)})`;
      } else if (action.action.color_temperature?.mirek) {
        const kelvin = 1000000 / action.action.color_temperature.mirek;
        if (kelvin < 3000) return '#ffb366'; // Warm
        if (kelvin > 5000) return '#b3d9ff'; // Cool
        return '#fff3e6'; // Neutral
      }
      return '#fff3e6';
    });
  };

  // Helper function to get scene emoji
  const getSceneEmoji = (sceneName: string): string => {
    const name = sceneName.toLowerCase();
    if (name.includes('galaxy')) return '🌌';
    if (name.includes('candle')) return '🕯️';
    if (name.includes('bright') || name.includes('energize')) return '☀️';
    if (name.includes('relax') || name.includes('rest')) return '🧘';
    if (name.includes('concentrate') || name.includes('read')) return '📚';
    if (name.includes('party') || name.includes('dance')) return '🎉';
    if (name.includes('night') || name.includes('dimmed')) return '🌙';
    if (name.includes('tropical') || name.includes('sunset')) return '🌅';
    if (name.includes('spring') || name.includes('blossom')) return '🌸';
    if (name.includes('autumn') || name.includes('fall')) return '🍂';
    if (name.includes('winter') || name.includes('snow')) return '❄️';
    if (name.includes('ocean') || name.includes('blue')) return '🌊';
    if (name.includes('forest') || name.includes('green')) return '🌲';
    if (name.includes('savanna') || name.includes('yellow')) return '🦁';
    if (
      name.includes('modern') ||
      name.includes('soho') ||
      name.includes('fairfax')
    )
      return '🏙️';
    return '🎨';
  };

  // Helper function to get device icon
  const getDeviceIcon = (device: HueDevice): string => {
    const productName = device.product_data.product_name.toLowerCase();
    if (productName.includes('dimmer switch')) return '🎛️';
    if (productName.includes('tap switch')) return '⚡';
    if (productName.includes('motion sensor')) return '👁️';
    if (productName.includes('temperature sensor')) return '🌡️';
    if (productName.includes('bridge')) return '🌉';
    return '📱';
  };

  // Filter devices to get switches
  const switches = Object.values(devices).filter((device) =>
    device.product_data.product_name.toLowerCase().includes('switch')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🏡 Philips Hue Dashboard
            </h1>
            <p className="mt-1 text-gray-600">
              Loading your smart home setup...
            </p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Hue data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🏡 Philips Hue Dashboard
            </h1>
            <p className="mt-1 text-red-600">Error loading data</p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </main>
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
            rooms • {Object.keys(scenes).length} scenes • {switches.length}{' '}
            switches
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">🎛️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Switches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {switches.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Switches Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                🎛️ Smart Switches & Controls
              </h2>
              <p className="text-orange-100">
                Physical controls for your Hue system
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {switches.map((device) => {
                  const buttonServices = device.services.filter(
                    (s) => s.rtype === 'button'
                  );
                  const powerService = device.services.find(
                    (s) => s.rtype === 'device_power'
                  );
                  const connectivityService = device.services.find(
                    (s) =>
                      s.rtype === 'zigbee_connectivity' ||
                      s.rtype === 'zgp_connectivity'
                  );
                  const isDimmerSwitch = device.product_data.product_name
                    .toLowerCase()
                    .includes('dimmer');
                  const isTapSwitch = device.product_data.product_name
                    .toLowerCase()
                    .includes('tap');

                  return (
                    <Link
                      key={device.id}
                      href={`/devices/${device.id}`}
                      className="bg-gray-50 rounded-lg p-6 border hover:bg-gray-100 transition-colors block"
                    >
                      {/* Header */}
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="text-4xl">{getDeviceIcon(device)}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {device.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {device.product_data.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Model: {device.product_data.model_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-gray-600">
                              Connected
                            </span>
                          </div>
                          {device.product_data.software_version && (
                            <p className="text-xs text-gray-500">
                              v{device.product_data.software_version}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Switch Type Info */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Switch Configuration
                        </h4>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">
                                Type:
                              </span>
                              <p className="font-medium">
                                {isDimmerSwitch
                                  ? 'Dimmer Switch'
                                  : isTapSwitch
                                  ? 'Tap Switch'
                                  : 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Buttons/Zones:
                              </span>
                              <p className="font-medium">
                                {buttonServices.length}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Connectivity:
                              </span>
                              <p className="font-medium capitalize">
                                {connectivityService?.rtype.replace('_', ' ') ||
                                  'Unknown'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">
                                Power Source:
                              </span>
                              <p className="font-medium">
                                {powerService ? 'Battery' : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Button Layout */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          {isDimmerSwitch ? 'Button Layout' : 'Tap Zones'}
                        </h4>
                        <div className="bg-white rounded-lg p-4 border">
                          {isDimmerSwitch ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium">ON Button</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  Turn lights on / Cycle scenes
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">
                                    Dim Up (+)
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  Increase brightness
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <span className="font-medium">
                                    Dim Down (-)
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  Decrease brightness
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <span className="font-medium">
                                    OFF Button
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  Turn lights off
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {buttonServices.map((_, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-purple-50 rounded"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                    <span className="font-medium">
                                      Zone {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    Tap to activate
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Technical Details
                        </h4>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Device ID:
                              </span>
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {device.id.substring(0, 8)}...
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Manufacturer:
                              </span>
                              <span className="text-sm font-medium">
                                {device.product_data.manufacturer_name.replace(
                                  'Signify Netherlands B.V.',
                                  'Philips Hue'
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Archetype:
                              </span>
                              <span className="text-sm font-medium capitalize">
                                {device.archetype.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Hardware Platform:
                              </span>
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {device.product_data.hardware_platform_type ||
                                  'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Device Services
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {device.services.map((service, index) => {
                            const serviceColors = {
                              button: 'bg-blue-100 text-blue-700',
                              zigbee_connectivity:
                                'bg-green-100 text-green-700',
                              zgp_connectivity: 'bg-green-100 text-green-700',
                              device_power: 'bg-yellow-100 text-yellow-700',
                              device_software_update:
                                'bg-purple-100 text-purple-700',
                            };
                            const colorClass =
                              serviceColors[
                                service.rtype as keyof typeof serviceColors
                              ] || 'bg-gray-100 text-gray-700';

                            return (
                              <span
                                key={index}
                                className={`px-3 py-1 ${colorClass} text-xs rounded-full font-medium`}
                              >
                                {service.rtype.replace('_', ' ')}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scene Cycling (for dimmer switches) */}
                      {isDimmerSwitch && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            🔄 Scene Cycling Configuration
                          </h4>
                          {(() => {
                            const switchCycle = switchSceneCycles.find(
                              (cycle) =>
                                cycle.switchName.includes(
                                  device.name.match(/\d+/)?.[0] || ''
                                )
                            );

                            if (switchCycle && switchCycle.scenes.length > 0) {
                              return (
                                <div className="bg-white rounded-lg p-4 border">
                                  <p className="text-sm text-gray-600 mb-3">
                                    ON button cycles through these scenes:
                                  </p>
                                  <div className="space-y-2">
                                    {switchCycle.scenes.map((scene, index) => (
                                      <div
                                        key={scene.id}
                                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-gray-700">
                                            {index + 1}.
                                          </span>
                                          <span className="text-sm font-medium">
                                            {scene.name}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {scene.order === 0
                                            ? 'Initial'
                                            : `Step ${scene.order}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-3">
                                    💡 These are the specific scenes configured
                                    for this switch, which may be different from
                                    the room's available scenes.
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                  <p className="text-sm text-gray-600">
                                    No scene cycling configuration found for
                                    this switch.
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {/* Usage Tips */}
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h5 className="font-medium text-blue-900 mb-2">
                          💡 Usage Tips
                        </h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {isDimmerSwitch ? (
                            <>
                              <li>
                                • Press and hold dim buttons for continuous
                                adjustment
                              </li>
                              <li>
                                • ON button cycles through your configured
                                scenes
                              </li>
                              <li>• Double-tap ON for last used scene</li>
                            </>
                          ) : (
                            <>
                              <li>
                                • Each zone can be programmed to different
                                scenes
                              </li>
                              <li>
                                • No battery required - uses kinetic energy
                              </li>
                              <li>
                                • Tap zones are customizable in the Hue app
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Room Details */}
          {Object.entries(rooms).map(([roomId, room]) => {
            const roomLights = Object.values(lights).filter((light) =>
              room.children?.some(
                (child) => child.rid === light.id && child.rtype === 'light'
              )
            );
            const roomScenes = Object.values(scenes).filter(
              (scene) => scene.group?.rid === roomId
            );

            return (
              <div
                key={roomId}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <Link
                  href={`/rooms/${roomId}`}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 block hover:from-blue-600 hover:to-purple-700 transition-colors"
                >
                  <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                  <p className="text-blue-100 capitalize">
                    {room.archetype?.replace('_', ' ')} • Click for details
                  </p>
                </Link>

                <div className="p-6">
                  {/* Lights */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💡 Lights ({roomLights.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roomLights.map((light) => (
                        <Link
                          key={light.id}
                          href={`/lights/${light.id}`}
                          className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors block"
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
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Scenes */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🎭 Scenes ({roomScenes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roomScenes.map((scene) => {
                        const sceneColors = getSceneColors(scene);
                        const affectedLights = scene.actions?.length || 0;

                        return (
                          <Link
                            key={scene.id}
                            href={`/scenes/${scene.id}`}
                            className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors block"
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
                                  {affectedLights} light
                                  {affectedLights !== 1 ? 's' : ''} affected
                                </p>
                              </div>
                            </div>

                            {sceneColors.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Colors:
                                </p>
                                <div className="flex space-x-1">
                                  {sceneColors.map((color, index) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                                      style={{ backgroundColor: color }}
                                      title={`Light ${index + 1}: ${color}`}
                                    />
                                  ))}
                                  {sceneColors.length <
                                    (scene.actions?.length || 0) && (
                                    <div className="text-xs text-gray-400 ml-1">
                                      +
                                      {(scene.actions?.length || 0) -
                                        sceneColors.length}{' '}
                                      more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

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
                                  ✨ Dynamic Scene
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Global Scenes */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                🌟 Global Scenes
              </h2>
              <p className="text-purple-100">
                Scenes that affect multiple rooms or zones
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(scenes)
                  .filter(
                    (scene) => scene.group?.rtype === 'zone' || !scene.group
                  )
                  .map((scene) => {
                    const sceneColors = getSceneColors(scene);
                    const affectedLights = scene.actions?.length || 0;

                    return (
                      <Link
                        key={scene.id}
                        href={`/scenes/${scene.id}`}
                        className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors block"
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
                              {affectedLights} light
                              {affectedLights !== 1 ? 's' : ''} affected
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-1 mb-2">
                          {sceneColors.slice(0, 8).map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          {sceneColors.length > 8 && (
                            <div className="text-xs text-gray-400">
                              +{sceneColors.length - 8} more
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-600">
                          Actions: {scene.actions?.length || 0}
                          {scene.auto_dynamic && (
                            <span className="text-purple-600 ml-2">
                              ✨ Dynamic
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
