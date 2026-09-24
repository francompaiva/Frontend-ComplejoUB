import React from 'react';

export type AdminActionType = 'AsignarTurno' | 'BloquearMantenimiento';
export type AdminActionVariant = 'Primary' | 'Secondary';

interface AdminActionBtnProps {
  action: AdminActionType;
  variant?: AdminActionVariant;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const AdminActionBtn: React.FC<AdminActionBtnProps> = ({
  action,
  variant,
  onClick,
  disabled = false,
  className = ''
}) => {
  const isPrimary = variant === 'Primary' || (!variant && action === 'AsignarTurno');

  if (action === 'AsignarTurno') {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label="Asignar Turno Manual"
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isPrimary
            ? 'bg-[#65C556] text-[#293827] hover:brightness-105 active:scale-[0.98]'
            : 'bg-[#293827] text-[#65C556] border border-[#65C556] hover:bg-[#65C556]/10'
        } ${className}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>Asignar Turno Manual</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Bloquear por Mantenimiento"
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#293827] text-white border-2 border-[#689E5F] hover:border-[#57EF40] hover:bg-[#1E281D] active:scale-[0.98] ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <span className="text-[#57EF40] text-sm font-bold leading-none">⊘</span>
      <span>Bloquear por Mantenimiento</span>
    </button>
  );
};

export default AdminActionBtn;

