// frontend/src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/',          icon: '📊', label: 'Dashboard'  },
  { to: '/pos',       icon: '🛒', label: 'POS Billing' },
  { to: '/invoices',  icon: '🧾', label: 'Invoices'    },
  { to: '/inventory', icon: '📦', label: 'Inventory'   },
  { to: '/expenses',  icon: '💸', label: 'Expenses'    },
  { to: '/reports',   icon: '📈', label: 'Reports'     },
];

export default function Layout() {
  const { profile, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 968) {
      setSidebarOpen(v => !v);
    } else {
      setCollapsed(v => !v);
    }
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 968) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''} ${sidebarOpen ? 'layout--sidebar-open' : ''}`}
         onClick={(e) => e.target.classList.contains('layout--sidebar-open') && closeSidebar()}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <img src="/logo-shopdesk.svg" alt="ShopDesk logo" />
          </div>
          {!collapsed && <span className="sidebar__name">ShopDesk POS</span>}
        </div>

        <nav className="sidebar__nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} 
              onClick={closeSidebar}
              className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
              <span className="sidebar__icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/users" 
              onClick={closeSidebar}
              className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
              <span className="sidebar__icon">👥</span>
              {!collapsed && <span>Users</span>}
            </NavLink>
          )}
        </nav>

        <div className="sidebar__footer">
          {!collapsed && (
            <div className="sidebar__user">
              <div className="sidebar__avatar">{profile?.full_name?.[0] || 'U'}</div>
              <div>
                <div className="sidebar__uname">{profile?.full_name}</div>
                <div className="sidebar__role">{profile?.role}</div>
              </div>
            </div>
          )}
          <button className="sidebar__logout" onClick={logout} title="Logout">🚪</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        <div className="topbar">
          <button type="button" className="topbar__toggle" onClick={toggleSidebar} aria-label="Toggle menu">☰</button>
          <div className="topbar__title">ShopDesk POS</div>
          <div className="topbar__user">
            <span className="badge badge-blue">{profile?.role}</span>
            <span style={{ fontWeight: 600 }}>{profile?.full_name}</span>
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
