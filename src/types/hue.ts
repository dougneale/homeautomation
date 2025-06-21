// Philips Hue API Type Definitions

export interface HueLight {
  id: string;
  type: string;
  metadata: {
    name: string;
  };
  on: {
    on: boolean;
  };
  dimming?: {
    brightness: number;
  };
  color_temperature?: {
    mirek: number;
  };
  color?: {
    xy: {
      x: number;
      y: number;
    };
  };
  owner: {
    rid: string;
    rtype: string;
  };
}

export interface HueRoom {
  id: string;
  type: string;
  children: Array<{
    rid: string;
    rtype: string;
  }>;
  metadata: {
    name: string;
    archetype: string;
  };
}

export interface HueScene {
  id: string;
  metadata: {
    name: string;
  };
  group: {
    rid: string;
    rtype: string;
  };
  actions: Array<{
    target: {
      rid: string;
      rtype: string;
    };
    action: {
      on?: {
        on: boolean;
      };
      dimming?: {
        brightness: number;
      };
      color_temperature?: {
        mirek: number;
      };
      color?: {
        xy: {
          x: number;
          y: number;
        };
      };
    };
  }>;
}

export interface HueBridge {
  ip: string;
  id: string;
  internalipaddress: string;
}

export interface HueConfig {
  bridge: {
    ip: string;
    apiKey: string;
    appName: string;
  };
  lights: Record<string, HueLight>;
  rooms: Record<string, HueRoom>;
  scenes: Record<string, HueScene>;
}

export interface HueApiResponse<T> {
  errors: Array<{
    description: string;
  }>;
  data: T[];
}

export interface HueApiError {
  description: string;
  type: number;
  address: string;
}
