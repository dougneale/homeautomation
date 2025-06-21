import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

interface HueRoom {
  id: string;
  name: string;
  archetype?: string;
  children?: Array<{
    rid: string;
    rtype: string;
  }>;
}

async function loadRooms(): Promise<Record<string, HueRoom>> {
  try {
    const filePath = path.join(process.cwd(), 'public/config/rooms-v2.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.data || {};
  } catch (error) {
    console.error('Error loading rooms:', error);
    return {};
  }
}

export default async function RoomsPage() {
  const rooms = await loadRooms();

  const getRoomIcon = (archetype?: string) => {
    switch (archetype?.toLowerCase()) {
      case 'living_room':
        return '🛋️';
      case 'kitchen':
        return '🍳';
      case 'dining':
        return '🍽️';
      case 'bedroom':
        return '🛏️';
      case 'bathroom':
        return '🛁';
      case 'office':
        return '💼';
      case 'hallway':
        return '🚪';
      case 'garage':
        return '🚗';
      case 'garden':
        return '🌱';
      case 'balcony':
        return '🌸';
      default:
        return '🏠';
    }
  };

  const roomsList = Object.entries(rooms);

  return (
    <div className="rooms-page">
      <div className="header">
        <h1>🏠 Rooms</h1>
        <p>Control lighting in each room</p>
      </div>

      <div className="rooms-grid">
        {roomsList.map(([id, room]) => (
          <Link key={id} href={`/rooms/${id}`} className="room-card">
            <div className="room-icon">{getRoomIcon(room.archetype)}</div>
            <div className="room-info">
              <h3 className="room-name">{room.name}</h3>
              <p className="room-type">
                {room.archetype?.replace('_', ' ') || 'Room'}
              </p>
              <p className="room-devices">
                {room.children?.length || 0} devices
              </p>
            </div>
            <div className="room-arrow">→</div>
          </Link>
        ))}
      </div>

      {roomsList.length === 0 && (
        <div className="empty-state">
          <p>
            No rooms found. Make sure your bridge is connected and configured.
          </p>
        </div>
      )}
    </div>
  );
}
