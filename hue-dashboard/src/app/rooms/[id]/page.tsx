'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HueRoom {
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

interface HueDevice {
  id: string;
  name: string;
  archetype: string;
  product_data: {
    model_id: string;
    manufacturer_name: string;
    product_name: string;
    product_archetype: string;
  };
  services?: Array<{
    rid: string;
    rtype: string;
  }>;
}

interface HueLight {
  id: string;
  name: string;
  archetype: string;
  state: {
    on: boolean;
    brightness?: number;
    color_temperature?: number;
  };
}

export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<HueRoom | null>(null);
  const [devices, setDevices] = useState<Record<string, HueDevice>>({});
  const [lights, setLights] = useState<Record<string, HueLight>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoomData = async () => {
    try {
      const [roomsResponse, devicesResponse, lightsResponse] =
        await Promise.all([
          fetch('/config/rooms-v2.json'),
          fetch('/config/devices-v2.json'),
          fetch('/config/lights-v2.json'),
        ]);

      const [roomsData, devicesData, lightsData] = await Promise.all([
        roomsResponse.json(),
        devicesResponse.json(),
        lightsResponse.json(),
      ]);

      const foundRoom = roomsData.rooms[roomId];
      if (foundRoom) {
        setRoom(foundRoom);
        setDevices(devicesData.devices || {});
        setLights(lightsData.lights || {});
      } else {
        setError('Room not found');
      }
    } catch (err) {
      setError('Failed to load room data');
      console.error('Error loading room:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const getRoomIcon = (archetype: string) => {
    const icons: { [key: string]: string } = {
      living_room: '🛋️',
      kitchen: '🍳',
      dining: '🍽️',
      bedroom: '🛏️',
      kids_bedroom: '🧸',
      bathroom: '🛁',
      nursery: '👶',
      recreation: '🎮',
      office: '💼',
      gym: '🏋️',
      hallway: '🚪',
      toilet: '🚽',
      front_door: '🚪',
      garage: '🚗',
      terrace: '🌿',
      garden: '🌱',
      driveway: '🚗',
      carport: '🏠',
      home: '🏠',
      downstairs: '⬇️',
      upstairs: '⬆️',
      top_floor: '🔝',
      attic: '🏠',
      guest_room: '🛏️',
      staircase: '🪜',
      lounge: '🛋️',
      man_cave: '🍺',
      computer: '💻',
      studio: '🎨',
      music: '🎵',
      tv: '📺',
      reading: '📚',
      closet: '👔',
      storage: '📦',
      laundry_room: '🧺',
      balcony: '🌅',
      porch: '🏡',
      barbecue: '🔥',
      pool: '🏊',
    };
    return icons[archetype] || '🏠';
  };

  const getDeviceIcon = (archetype: string) => {
    const icons: { [key: string]: string } = {
      hue_lightstrip: '💡',
      table_shade: '🛋️',
      ceiling_round: '🔆',
      wall_lantern: '🏮',
      pendant_round: '💡',
      flexible_lamp: '🔦',
      recessed_ceiling: '💡',
      single_spot: '🔦',
      unknown_archetype: '❓',
    };
    return icons[archetype] || '💡';
  };

  const getRoomDevices = () => {
    if (!room) return [];
    return room.children
      .filter((child) => child.rtype === 'device')
      .map((child) => devices[child.rid])
      .filter(Boolean);
  };

  const getRoomLights = () => {
    const roomDevices = getRoomDevices();
    const roomLights: HueLight[] = [];

    roomDevices.forEach((device) => {
      if (device?.services) {
        device.services.forEach((service) => {
          if (service.rtype === 'light' && lights[service.rid]) {
            roomLights.push(lights[service.rid]);
          }
        });
      }
    });

    return roomLights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p>Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <p className="text-red-400 mb-4">{error || 'Room not found'}</p>
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

  const roomDevices = getRoomDevices();
  const roomLights = getRoomLights();

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
            {getRoomIcon(room.archetype)} {room.name}
          </h1>
          <p className="text-purple-300 text-lg capitalize">
            {room.archetype.replace('_', ' ')}
          </p>
        </div>

        {/* Room Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Room Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-500">
                🔌
              </div>
              <p className="text-white font-medium">{roomDevices.length}</p>
              <p className="text-purple-300 text-sm">Devices</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-yellow-500">
                💡
              </div>
              <p className="text-white font-medium">{roomLights.length}</p>
              <p className="text-purple-300 text-sm">Lights</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-green-500">
                🟢
              </div>
              <p className="text-white font-medium">
                {roomLights.filter((light) => light.state.on).length}
              </p>
              <p className="text-purple-300 text-sm">On</p>
            </div>
          </div>
        </div>

        {/* Devices */}
        {roomDevices.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Devices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomDevices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getDeviceIcon(device.archetype)}
                    </span>
                    <div>
                      <h3 className="text-white font-medium">{device.name}</h3>
                      <p className="text-purple-300 text-sm capitalize">
                        {device.archetype.replace('_', ' ')}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {device.product_data.product_name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lights */}
        {roomLights.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Lights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomLights.map((light) => (
                <Link
                  key={light.id}
                  href={`/lights/${light.id}`}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h3 className="text-white font-medium">{light.name}</h3>
                        <p className="text-purple-300 text-sm capitalize">
                          {light.archetype.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          light.state.on ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      ></div>
                      {light.state.brightness !== undefined && (
                        <span className="text-white text-sm">
                          {Math.round(light.state.brightness)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
                  <strong>ID:</strong> {room.id}
                </li>
                {room.id_v1 && (
                  <li>
                    <strong>Legacy ID:</strong> {room.id_v1}
                  </li>
                )}
                <li>
                  <strong>Type:</strong> {room.type}
                </li>
                <li>
                  <strong>Archetype:</strong> {room.archetype}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Services</h3>
              <ul className="space-y-1 text-sm">
                {room.services.map((service, index) => (
                  <li key={index}>
                    <strong>{service.rtype}:</strong>{' '}
                    {service.rid.substring(0, 8)}...
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
