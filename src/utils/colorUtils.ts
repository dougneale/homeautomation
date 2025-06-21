// Color utility functions for Hue light visualization

/**
 * Convert XY color coordinates to RGB values
 * Based on Philips Hue color conversion formulas
 */
export function xyToRgb(
  x: number,
  y: number,
  brightness: number = 100
): { r: number; g: number; b: number } {
  // Calculate XYZ values
  const z = 1.0 - x - y;
  const Y = brightness / 100.0; // Convert brightness percentage to Y value
  const X = (Y / y) * x;
  const Z = (Y / y) * z;

  // Convert XYZ to RGB using sRGB color space matrix
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  // Apply reverse gamma correction
  r =
    r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, 1.0 / 2.4) - 0.055;
  g =
    g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, 1.0 / 2.4) - 0.055;
  b =
    b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, 1.0 / 2.4) - 0.055;

  // Normalize and constrain to 0-255 range
  const maxValue = Math.max(r, g, b);
  if (maxValue > 1) {
    r = r / maxValue;
    g = g / maxValue;
    b = b / maxValue;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255))),
  };
}

/**
 * Convert color temperature (mirek) to RGB
 */
export function mirekToRgb(
  mirek: number,
  brightness: number = 100
): { r: number; g: number; b: number } {
  // Convert mirek to Kelvin (mirek = 1,000,000 / Kelvin)
  const kelvin = 1000000 / mirek;

  let r, g, b;

  // Calculate red
  if (kelvin >= 6600) {
    r = 329.698727466 * Math.pow(kelvin / 100 - 60, -0.1332047592);
  } else {
    r = 255;
  }

  // Calculate green
  if (kelvin >= 6600) {
    g = 288.1221695283 * Math.pow(kelvin / 100 - 60, -0.0755148492);
  } else {
    g = 99.4708025861 * Math.log(kelvin / 100) - 161.1195681661;
  }

  // Calculate blue
  if (kelvin >= 6600) {
    b = 255;
  } else if (kelvin < 1900) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(kelvin / 100 - 10) - 305.0447927307;
  }

  // Apply brightness and constrain to 0-255 range
  const brightnessMultiplier = brightness / 100;
  return {
    r: Math.max(0, Math.min(255, Math.round(r * brightnessMultiplier))),
    g: Math.max(0, Math.min(255, Math.round(g * brightnessMultiplier))),
    b: Math.max(0, Math.min(255, Math.round(b * brightnessMultiplier))),
  };
}

/**
 * Convert RGB values to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get RGB color string from XY coordinates
 */
export function xyToHex(
  x: number,
  y: number,
  brightness: number = 100
): string {
  const rgb = xyToRgb(x, y, brightness);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Get RGB color string from color temperature
 */
export function mirekToHex(mirek: number, brightness: number = 100): string {
  const rgb = mirekToRgb(mirek, brightness);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Get display color for a light based on its state
 */
export function getLightColor(light: any): string {
  if (!light.state.on) {
    return '#374151'; // Gray for off lights
  }

  const brightness = light.state.brightness || 100;

  // Prefer XY color if available
  if (light.state.color_xy) {
    return xyToHex(light.state.color_xy.x, light.state.color_xy.y, brightness);
  }

  // Fall back to color temperature
  if (light.state.color_temperature) {
    return mirekToHex(light.state.color_temperature, brightness);
  }

  // Default warm white if no color info
  return mirekToHex(366, brightness); // ~2700K warm white
}

/**
 * Get readable brightness percentage
 */
export function getBrightnessPercentage(brightness: number | null): string {
  if (brightness === null || brightness === undefined) return '0%';
  return `${Math.round(brightness)}%`;
}
