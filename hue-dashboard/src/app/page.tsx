import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  Palette,
  Zap,
  Home,
  Settings,
  Sliders,
  Power,
  Plus,
  Minus,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Type definitions
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

interface SwitchScene {
  id: string;
  name: string;
  order: number;
}

interface SwitchSceneCycle {
  switchId: string;
  switchName: string;
  scenes: SwitchScene[];
}

interface BridgeRule {
  name?: string;
  actions?: Array<{
    body?: {
      scene?: string;
    };
  }>;
  conditions?: Array<{
    address?: string;
    operator?: string;
    value?: string;
  }>;
}

interface BridgeData {
  rules?: Record<string, BridgeRule>;
}

interface ScenesV1Data {
  scenes?: Record<
    string,
    {
      name?: string;
    }
  >;
}

// Server-side data loading
async function loadHueData() {
  const configPath = path.join(process.cwd(), 'src/config');
  try {
    const lightsData = JSON.parse(
      fs.readFileSync(path.join(configPath, 'lights-v2.json'), 'utf8')
    );
    const roomsData = JSON.parse(
      fs.readFileSync(path.join(configPath, 'rooms-v2.json'), 'utf8')
    );
    const scenesData = JSON.parse(
      fs.readFileSync(path.join(configPath, 'scenes-v2.json'), 'utf8')
    );
    const devicesData = JSON.parse(
      fs.readFileSync(path.join(configPath, 'devices-v2.json'), 'utf8')
    );
    const bridgeData = JSON.parse(
      fs.readFileSync(path.join(configPath, 'bridge.json'), 'utf8')
    );
    const scenesV1Data = JSON.parse(
      fs.readFileSync(path.join(configPath, 'scenes.json'), 'utf8')
    );

    return {
      lights: lightsData.data || {},
      rooms: roomsData.data || {},
      scenes: scenesData.data || {},
      devices: devicesData.data || {},
      bridge: bridgeData,
      scenesV1: scenesV1Data,
    };
  } catch (error) {
    console.error('Error loading Hue data:', error);
    return {
      lights: {},
      rooms: {},
      scenes: {},
      devices: {},
      bridge: null,
      scenesV1: null,
    };
  }
}

// Helper functions
function getLightColor(light: HueLight) {
  if (!light.state.on) return 'hsl(var(--muted))';
  if (light.state.color_temperature) {
    const kelvin = 1000000 / light.state.color_temperature;
    if (kelvin < 3000) return 'hsl(25, 95%, 68%)'; // Warm orange
    if (kelvin > 5000) return 'hsl(200, 95%, 78%)'; // Cool blue
    return 'hsl(45, 93%, 90%)'; // Neutral warm
  }
  return 'hsl(45, 93%, 90%)';
}

function getSceneEmoji(sceneName: string): string {
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
}

function parseSwitchSceneCycling(
  bridgeData: BridgeData,
  scenesV1Data: ScenesV1Data
) {
  const switchCycles: SwitchSceneCycle[] = [];
  if (!bridgeData?.rules || !scenesV1Data?.scenes) return switchCycles;

  const switchRuleGroups: { [key: string]: BridgeRule[] } = {};
  Object.values(bridgeData.rules).forEach((rule: any) => {
    if (rule.name && rule.actions && rule.conditions) {
      const hasSceneAction = rule.actions.some(
        (action: any) => action.body?.scene
      );
      if (hasSceneAction && rule.name.includes('dimmer switch')) {
        const switchMatch = rule.name.match(/dimmer switch (\d+)/);
        if (switchMatch) {
          const switchId = switchMatch[1];
          if (!switchRuleGroups[switchId]) switchRuleGroups[switchId] = [];
          switchRuleGroups[switchId].push(rule);
        }
      }
    }
  });

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
      const scenes: any[] = [];
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
          scenes.push({ id: sceneId, name: sceneName, order: statusValue });
        }
      });

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
          scenes.push({ id: sceneId, name: sceneName, order: 0 });
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

export default async function Dashboard() {
  const { lights, rooms, scenes, devices, bridge, scenesV1 } =
    await loadHueData();

  const lightsArray = Object.values(lights);
  const roomsArray = Object.values(rooms);
  const scenesArray = Object.values(scenes);
  const devicesArray = Object.values(devices);

  const lightsOn = lightsArray.filter(
    (light: HueLight) => light.state?.on
  ).length;
  const totalLights = lightsArray.length;
  const lightsPercentage = totalLights > 0 ? (lightsOn / totalLights) * 100 : 0;

  const switches = devicesArray.filter((device: HueDevice) =>
    device.product_data.product_name.toLowerCase().includes('switch')
  );
  const switchSceneCycles = parseSwitchSceneCycling(bridge, scenesV1);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hue Control Center
            </h1>
            <p className="text-muted-foreground">
              {totalLights} lights • {roomsArray.length} rooms •{' '}
              {scenesArray.length} scenes • {switches.length} switches
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              System Online
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Lights
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lightsOn}</div>
              <p className="text-xs text-muted-foreground">
                of {totalLights} total
              </p>
              <Progress value={lightsPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rooms</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomsArray.length}</div>
              <p className="text-xs text-muted-foreground">configured spaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scenes</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scenesArray.length}</div>
              <p className="text-xs text-muted-foreground">available moods</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Controls</CardTitle>
              <Sliders className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{switches.length}</div>
              <p className="text-xs text-muted-foreground">physical switches</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="switches">Smart Switches</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Zones</TabsTrigger>
            <TabsTrigger value="scenes">Scene Library</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    All Lights On
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Power className="mr-2 h-4 w-4" />
                    All Lights Off
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Evening Scene
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Morning Routine
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bridge Status</span>
                    <Badge variant="default" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network</span>
                    <Badge variant="default" className="text-xs">
                      Stable
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Update</span>
                    <span className="text-xs text-muted-foreground">
                      2 min ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-xs text-muted-foreground">~50ms</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Living Room dimmed to 50%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Kitchen lights turned on</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Evening scene activated</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lights Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Active Lights</CardTitle>
                <CardDescription>
                  Current status of all your lights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {lightsArray.slice(0, 12).map((light: any) => (
                    <Link key={light.id} href={`/lights/${light.id}`}>
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{
                                  backgroundColor: getLightColor(light),
                                }}
                              />
                              <span className="text-sm font-medium truncate">
                                {light.name}
                              </span>
                            </div>
                            <Badge
                              variant={
                                light.state?.on ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {light.state?.on ? 'ON' : 'OFF'}
                            </Badge>
                          </div>
                          {light.state?.on && (
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground mb-1">
                                {light.state.brightness || 0}% brightness
                              </div>
                              <Progress
                                value={light.state.brightness || 0}
                                className="h-1"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Switches Tab */}
          <TabsContent value="switches" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {switches.map((device: any) => {
                const buttonServices = device.services.filter(
                  (s: any) => s.rtype === 'button'
                );
                const isDimmerSwitch = device.product_data.product_name
                  .toLowerCase()
                  .includes('dimmer');
                const isTapSwitch = device.product_data.product_name
                  .toLowerCase()
                  .includes('tap');
                const switchCycle = switchSceneCycles.find((cycle: any) =>
                  cycle.switchName.includes(device.name.match(/\d+/)?.[0] || '')
                );

                return (
                  <Card key={device.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {isDimmerSwitch ? '🎛️' : isTapSwitch ? '⚡' : '📱'}
                            {device.name}
                          </CardTitle>
                          <CardDescription>
                            {device.product_data.product_name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Connected
                          </Badge>
                          <Link href={`/devices/${device.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Switch Type Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type</span>
                          <p className="font-medium">
                            {isDimmerSwitch
                              ? 'Dimmer Switch'
                              : isTapSwitch
                              ? 'Tap Switch'
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Buttons</span>
                          <p className="font-medium">{buttonServices.length}</p>
                        </div>
                      </div>

                      {/* Button Layout */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Button Layout
                        </h4>
                        <div className="space-y-2">
                          {isDimmerSwitch ? (
                            <>
                              <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 border">
                                <div className="flex items-center gap-2">
                                  <Power className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm font-medium">
                                    ON
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Cycle scenes
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-md bg-green-50 border">
                                <div className="flex items-center gap-2">
                                  <Plus className="h-3 w-3 text-green-600" />
                                  <span className="text-sm font-medium">
                                    DIM +
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Brighten
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-md bg-yellow-50 border">
                                <div className="flex items-center gap-2">
                                  <Minus className="h-3 w-3 text-yellow-600" />
                                  <span className="text-sm font-medium">
                                    DIM -
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Dim
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded-md bg-red-50 border">
                                <div className="flex items-center gap-2">
                                  <Power className="h-3 w-3 text-red-600" />
                                  <span className="text-sm font-medium">
                                    OFF
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Turn off
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {buttonServices.map((_: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 rounded-md bg-purple-50 border"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-purple-600" />
                                    <span className="text-sm font-medium">
                                      Zone {index + 1}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scene Cycling */}
                      {isDimmerSwitch &&
                        switchCycle &&
                        switchCycle.scenes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <RotateCcw className="h-4 w-4" />
                              Scene Cycling
                            </h4>
                            <div className="space-y-1">
                              {switchCycle.scenes.map(
                                (scene: any, index: number) => (
                                  <div
                                    key={scene.id}
                                    className="flex items-center justify-between py-1 px-2 rounded text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                                      >
                                        {index + 1}
                                      </Badge>
                                      <span>{scene.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {scene.order === 0
                                        ? 'Default'
                                        : `Step ${scene.order}`}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="grid gap-6">
              {Object.entries(rooms).map(([roomId, room]: [string, any]) => {
                const roomLights = lightsArray.filter((light: any) =>
                  room.children?.some(
                    (child: any) =>
                      child.rid === light.id && child.rtype === 'light'
                  )
                );
                const roomScenes = scenesArray.filter(
                  (scene: any) => scene.group?.rid === roomId
                );
                const roomLightsOn = roomLights.filter(
                  (light: any) => light.state?.on
                ).length;

                return (
                  <Card key={roomId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            {room.name}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {room.archetype?.replace('_', ' ')} •{' '}
                            {roomLights.length} lights • {roomScenes.length}{' '}
                            scenes
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={roomLightsOn > 0 ? 'default' : 'secondary'}
                          >
                            {roomLightsOn} of {roomLights.length} on
                          </Badge>
                          <Link href={`/rooms/${roomId}`}>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Room Lights */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Lights</h4>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {roomLights.map((light: any) => (
                            <Link key={light.id} href={`/lights/${light.id}`}>
                              <Card className="transition-colors hover:bg-muted/50">
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: getLightColor(light),
                                        }}
                                      />
                                      <span className="text-sm font-medium truncate">
                                        {light.name}
                                      </span>
                                    </div>
                                    <Badge
                                      variant={
                                        light.state?.on
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {light.state?.brightness || 0}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Room Scenes */}
                      {roomScenes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Scenes</h4>
                          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {roomScenes.map((scene: any) => (
                              <Link key={scene.id} href={`/scenes/${scene.id}`}>
                                <Card className="transition-colors hover:bg-muted/50">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">
                                        {getSceneEmoji(scene.name)}
                                      </span>
                                      <div>
                                        <span className="text-sm font-medium">
                                          {scene.name}
                                        </span>
                                        {scene.auto_dynamic && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs"
                                          >
                                            Dynamic
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Scenes Tab */}
          <TabsContent value="scenes" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {scenesArray.map((scene: any) => {
                const affectedLights = scene.actions?.length || 0;
                const isGlobal = scene.group?.rtype === 'zone' || !scene.group;

                return (
                  <Link key={scene.id} href={`/scenes/${scene.id}`}>
                    <Card className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="text-2xl">
                              {getSceneEmoji(scene.name)}
                            </span>
                            {isGlobal && (
                              <Badge variant="outline" className="text-xs">
                                Global
                              </Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{scene.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {affectedLights} light
                              {affectedLights !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {scene.auto_dynamic && (
                              <Badge variant="secondary" className="text-xs">
                                ✨ Dynamic
                              </Badge>
                            )}
                            {scene.speed && (
                              <Badge variant="outline" className="text-xs">
                                Speed: {scene.speed}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
