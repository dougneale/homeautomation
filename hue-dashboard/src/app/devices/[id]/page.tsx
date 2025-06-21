'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HueDevice {
  id: string;
  id_v1?: string;
  name: string;
  archetype: string;
  function?: string;
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
  metadata?: {
    control_id?: number;
  };
}

export default function DeviceDetail() {
  const params = useParams();
  const deviceId = params.id as string;
  const [device, setDevice] = useState<HueDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevice = async () => {
    try {
      const response = await fetch('/config/devices-v2.json');
      const data = await response.json();

      const foundDevice = data.devices[deviceId];
      if (foundDevice) {
        setDevice(foundDevice);
      } else {
        setError('Device not found');
      }
    } catch (err) {
      setError('Failed to load device data');
      console.error('Error loading device:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  const getDeviceIcon = (archetype: string) => {
    const icons: { [key: string]: string } = {
      hue_lightstrip: '💡',
      table_shade: '🛋️',
      ceiling_round: '🔆',
      wall_lantern: '🏮',
      pendant_round: '💡',
      flexible_lamp: '🔦',
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
      hue_dimmer_switch: '🎛️',
      hue_button: '🔘',
      hue_motion_sensor: '🚶',
      hue_temperature_sensor: '🌡️',
      unknown_archetype: '❓',
    };
    return icons[archetype] || '🔌';
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: { [key: string]: string } = {
      light: '💡',
      button: '🔘',
      relative_rotary: '🔄',
      temperature: '🌡️',
      light_level: '🔆',
      motion: '🚶',
      device_power: '🔋',
      zigbee_connectivity: '📡',
      entertainment: '🎭',
      taurus_7455: '📱',
      homekit: '🏠',
      matter: '🔗',
      grouped_light: '💡',
    };
    return icons[serviceType] || '⚙️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p>Loading device details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <p className="text-red-400 mb-4">{error || 'Device not found'}</p>
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
            {getDeviceIcon(device.archetype)} {device.name}
          </h1>
          <p className="text-purple-300 text-lg">
            {device.product_data.product_name}
          </p>
          <p className="text-gray-400">
            {device.product_data.manufacturer_name}
          </p>
        </div>

        {/* Device Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Device Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-500">
                ⚙️
              </div>
              <p className="text-white font-medium">{device.services.length}</p>
              <p className="text-purple-300 text-sm">Services</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-500">
                🏭
              </div>
              <p className="text-white font-medium capitalize">
                {device.archetype.replace('_', ' ')}
              </p>
              <p className="text-purple-300 text-sm">Type</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-purple-500">
                📱
              </div>
              <p className="text-white font-medium">
                {device.product_data.software_version || 'N/A'}
              </p>
              <p className="text-purple-300 text-sm">Software Version</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {device.services.map((service, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getServiceIcon(service.rtype)}
                  </span>
                  <div>
                    <h3 className="text-white font-medium capitalize">
                      {service.rtype.replace('_', ' ')}
                    </h3>
                    <p className="text-purple-300 text-sm">
                      {service.rid.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Product Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Basic Info</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Manufacturer:</strong>{' '}
                  {device.product_data.manufacturer_name}
                </li>
                <li>
                  <strong>Product Name:</strong>{' '}
                  {device.product_data.product_name}
                </li>
                <li>
                  <strong>Model ID:</strong> {device.product_data.model_id}
                </li>
                <li>
                  <strong>Product Archetype:</strong>{' '}
                  {device.product_data.product_archetype}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-300 mb-2">
                Technical Details
              </h3>
              <ul className="space-y-1 text-sm">
                {device.product_data.software_version && (
                  <li>
                    <strong>Software Version:</strong>{' '}
                    {device.product_data.software_version}
                  </li>
                )}
                {device.product_data.hardware_platform_type && (
                  <li>
                    <strong>Hardware Platform:</strong>{' '}
                    {device.product_data.hardware_platform_type}
                  </li>
                )}
                <li>
                  <strong>Device Type:</strong> {device.type}
                </li>
                {device.function && (
                  <li>
                    <strong>Function:</strong> {device.function}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            System Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">
                Identifiers
              </h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Device ID:</strong> {device.id}
                </li>
                {device.id_v1 && (
                  <li>
                    <strong>Legacy ID:</strong> {device.id_v1}
                  </li>
                )}
                {device.metadata?.control_id && (
                  <li>
                    <strong>Control ID:</strong> {device.metadata.control_id}
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-300 mb-2">
                Configuration
              </h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Archetype:</strong> {device.archetype}
                </li>
                <li>
                  <strong>Service Count:</strong> {device.services.length}
                </li>
                <li>
                  <strong>Last Updated:</strong>{' '}
                  {new Date().toLocaleDateString()}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
