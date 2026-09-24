import React from 'react';
import { useComplejo } from '../context/ComplejoContext';

export type AdminSection =
  | 'agenda'
  | 'overview'
  | 'canchas'
  | 'torneo'
  | 'resultados'
  | 'reportes'
  | 'auditoria';

export interface AdminLayoutProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: string }[] = [
  { id: 'agenda', label: 'Agenda Diaria', icon: '📅' },
  { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
  { id: 'canchas', label: 'Gestión de Canchas', icon: '⚽' },
  { id: 'torneo', label: 'Torneos y Fixture', icon: '🏆' },
  { id: 'resultados', label: 'Cargar Resultados', icon: '📝' },
  { id: 'reportes', label: 'Reportes y Métricas', icon: '📈' },
  { id: 'auditoria', label: 'Log de Auditoría', icon: '🛡️' }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  onNavigate,
  children
}) => {
  const { auditLogs } = useComplejo();

  return (
    <div className="flex size-full min-h-screen bg-[#293827] text-white font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside className="flex flex-col w-[260px] shrink-0 bg-[#1e281d] border-r border-[#5a7056] sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-[12px] px-[20px] py-[20px] border-b border-[#5a7056]">
          <div className="bg-[rgba(101,197,86,0.15)] flex items-center justify-center rounded-[10px] size-[38px] border border-[#65c556] text-xl">
            🏟️
          </div>
          <div>
            <p className="font-bold text-[14px] text-white leading-tight">
              Complejo Deportivo
            </p>
            <p className="font-extrabold text-[15px] text-[#65c556] leading-tight">
              UB • Admin Panel
            </p>
          </div>
        </div>

        {/* Admin Profile Card */}
        <div className="px-[16px] py-[14px] mx-[12px] my-[14px] bg-[#293827] rounded-[10px] border border-[#5a7056] flex items-center gap-[10px]">
          <div className="size-[34px] rounded-full bg-[#65c556] text-[#293827] font-black flex items-center justify-center text-sm">
            AD
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Administrador</p>
            <p className="text-[11px] text-[#65c556] truncate">Acceso Total Cátedra</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                    : 'text-[#c0c0c0] hover:bg-[#293827] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-[#5a7056] text-center text-[11px] text-[#a0a0a0]">
          <p>Auditoría: <strong className="text-white">{auditLogs.length}</strong> eventos</p>
          <p className="text-[10px] mt-0.5">TP1 Construcción de Software</p>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
