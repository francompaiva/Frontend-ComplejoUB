import React from 'react';

export type UserRole = 'Cliente / Capitán' | 'Administrador' | 'Árbitro';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  className?: string;
}

const ROLES: UserRole[] = ['Cliente / Capitán', 'Administrador', 'Árbitro'];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
  className = ''
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Selector de rol de usuario"
      className={`flex items-center p-1 bg-[#1E281D] border border-[#5A7056] rounded-lg gap-1 w-full select-none ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        backgroundColor: '#1E281D',
        border: '1px solid #5A7056',
        borderRadius: '8px',
        gap: '4px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {ROLES.map((role) => {
        const isActive = selectedRole === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelectRole(role)}
            style={{
              flex: 1,
              padding: '8px 6px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: isActive ? '#65C556' : 'transparent',
              color: isActive ? '#293827' : '#A3B8A1',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;
