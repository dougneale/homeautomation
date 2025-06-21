import { HueLight } from '@/types/hue';
import { getLightColor, getBrightnessPercentage } from '@/utils/colorUtils';

interface LightCardProps {
  light: HueLight;
}

export default function LightCard({ light }: LightCardProps) {
  const backgroundColor = getLightColor(light);
  const isOn = light.state.on;
  const brightness = getBrightnessPercentage(light.state.brightness);

  // Icon mapping for different light types
  const getIcon = (archetype: string) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getIcon(light.archetype)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{light.name}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {light.archetype.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isOn ? 'ON' : 'OFF'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Color Preview */}
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-inner"
            style={{ backgroundColor }}
          />
          <div className="text-sm text-gray-600">
            <div>Color: {backgroundColor}</div>
            <div>Brightness: {brightness}</div>
          </div>
        </div>

        {/* Color Details */}
        {light.state.color_xy && (
          <div className="text-xs text-gray-500">
            XY: ({light.state.color_xy.x.toFixed(3)},{' '}
            {light.state.color_xy.y.toFixed(3)})
          </div>
        )}

        {light.state.color_temperature && (
          <div className="text-xs text-gray-500">
            Temperature: {light.state.color_temperature} mirek (
            {Math.round(1000000 / light.state.color_temperature)}K)
          </div>
        )}

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mt-2">
          {light.capabilities.dimming && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              Dimmable
            </span>
          )}
          {light.capabilities.color && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
              Color
            </span>
          )}
          {light.capabilities.color_temperature && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
              Temperature
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
