'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: '🏠',
      description: 'Home overview',
    },
    {
      name: 'Lights',
      href: '/lights',
      icon: '💡',
      description: 'Manage lights',
    },
    {
      name: 'Rooms',
      href: '/rooms',
      icon: '🏠',
      description: 'Room controls',
    },
    {
      name: 'Scenes',
      href: '/scenes',
      icon: '🎭',
      description: 'Scene management',
    },
    {
      name: 'Devices',
      href: '/devices',
      icon: '📱',
      description: 'Device settings',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className={`sidebar-title ${isCollapsed ? 'hidden' : ''}`}>
          Hue Dashboard
        </h2>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className={`nav-text ${isCollapsed ? 'hidden' : ''}`}>
              {item.name}
            </span>
            {!isCollapsed && (
              <span className="nav-description">{item.description}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`footer-content ${isCollapsed ? 'hidden' : ''}`}>
          <p className="footer-text">Home Automation v1.0</p>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          z-index: 1000;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar.collapsed {
          width: 70px;
        }

        .sidebar-header {
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 80px;
        }

        .sidebar-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .sidebar-title.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .collapse-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s ease;
        }

        .collapse-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          color: white;
          text-decoration: none;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-left-color: rgba(255, 255, 255, 0.3);
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.15);
          border-left-color: white;
          font-weight: 600;
        }

        .nav-icon {
          font-size: 1.5rem;
          margin-right: 1rem;
          min-width: 1.5rem;
          text-align: center;
        }

        .nav-text {
          font-size: 1rem;
          font-weight: 500;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .nav-text.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .nav-description {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-left: auto;
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
        }

        .footer-content {
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .footer-content.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .footer-text {
          font-size: 0.75rem;
          opacity: 0.7;
          margin: 0;
          text-align: center;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          }

          .sidebar.collapsed {
            width: 100%;
          }

          .sidebar-header {
            padding: 1rem;
          }

          .sidebar-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 1rem;
          }

          .nav-item {
            flex: 1;
            min-width: calc(50% - 0.25rem);
            padding: 0.75rem;
            border-radius: 0.5rem;
            border-left: none;
            justify-content: center;
            text-align: center;
            flex-direction: column;
          }

          .nav-item:hover {
            border-left: none;
          }

          .nav-item.active {
            border-left: none;
            background: rgba(255, 255, 255, 0.2);
          }

          .nav-icon {
            margin-right: 0;
            margin-bottom: 0.25rem;
          }

          .nav-description {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
