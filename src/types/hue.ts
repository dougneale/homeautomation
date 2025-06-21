// Philips Hue API Type Definitions - Original V2 API types
export interface HueApiLight {
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

export interface HueApiRoom {
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

export interface HueApiScene {
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

// Hue Dashboard Type Definitions

export interface HueLight {
  id: string;
  id_v1?: string;
  name: string;
  archetype: string;
  function?: string;
  state: {
    on: boolean;
    brightness: number | null;
    color_temperature: number | null;
    color_xy: {
      x: number;
      y: number;
    } | null;
  };
  capabilities: {
    dimming: {
      brightness: number;
      min_dim_level: number;
    } | null;
    color_temperature: {
      mirek: number | null;
      mirek_valid: boolean;
      mirek_schema: {
        mirek_minimum: number;
        mirek_maximum: number;
      };
    } | null;
    color: {
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
    } | null;
  };
  type: string;
  mode: string;
}

export interface HueRoom {
  id: string;
  id_v1?: string;
  name: string;
  archetype: string;
  children: Array<{
    rid: string;
    rtype: string;
  }>;
  services: Array<{
    rid: string;
    rtype: string;
  }>;
  type: string;
}

export interface HueScene {
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
  speed?: number;
  auto_dynamic?: boolean;
  type: string;
}

export interface HueConfig {
  lights: Record<string, HueLight>;
  rooms: Record<string, HueRoom>;
  scenes: Record<string, HueScene>;
}

export interface ColorVisualization {
  rgb: string;
  brightness: number;
  temperature: number | null;
}
