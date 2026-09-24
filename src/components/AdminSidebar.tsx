import React from 'react';

export type AdminNavSection = 'agenda' | 'canchas' | 'torneo' | 'resultados';

interface AdminSidebarProps {
  activeSection: AdminNavSection;
  onSelectSection: (section: AdminNavSection) => void;
  className?: string;
}

interface NavItemDef {
  id: AdminNavSection;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'agenda', label: 'Agenda Diaria', icon: '📅' },
  { id: 'canchas', label: 'Gestión de Canchas', icon: '⚽' },
  { id: 'torneo', label: 'Organizar Torneo', icon: '🏆' },
  { id: 'resultados', label: 'Cargar Resultados', icon: '📝' }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  className = ''
}) => {
  return (
    <aside
      className={`admin-sidebar ${className}`}
      style={{
        width: '260px',
        backgroundColor: '#1E281D',
        borderRight: '1px solid #5A7056',
        borderRadius: '12px',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
        flexShrink: 0
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: '#65C556',
            color: '#293827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px'
          }}
        >
          UB
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
            Complejo UB
          </span>
          <span style={{ fontSize: '10px', color: '#57EF40', fontWeight: 600 }}>
            PANEL ADMINISTRADOR
          </span>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                border: isActive ? '1px solid #65C556' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(101, 197, 86, 0.15)' : 'transparent',
                color: isActive ? '#65C556' : '#A3B8A1',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px',
          backgroundColor: '#293827',
          border: '1px solid #5A7056',
          borderRadius: '8px'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '16px',
            backgroundColor: '#689E5F',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px'
          }}
        >
          AD
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
            Admin Central
          </span>
          <span style={{ fontSize: '10px', color: '#57EF40' }}>
            Superadministrador
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

