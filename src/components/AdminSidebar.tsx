import React from 'react';
import { IconCalendar, IconBall, IconTrophy, IconClipboard } from './Icons';

export type AdminNavSection = 'agenda' | 'canchas' | 'torneo' | 'resultados';

interface AdminSidebarProps {
  activeSection: AdminNavSection;
  onSelectSection: (section: AdminNavSection) => void;
  className?: string;
}

interface NavItemDef {
  id: AdminNavSection;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'agenda', label: 'Agenda Diaria', icon: <IconCalendar size={16} /> },
  { id: 'canchas', label: 'Gestión de Canchas', icon: <IconBall size={16} /> },
  { id: 'torneo', label: 'Organizar Torneo', icon: <IconTrophy size={16} /> },
  { id: 'resultados', label: 'Cargar Resultados', icon: <IconClipboard size={16} /> }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  className = ''
}) => {
  return (
    <aside className={`w-64 bg-white border-r border-slate-200 rounded-xl p-6 flex flex-col gap-6 font-['Inter',sans-serif] shrink-0 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm">
          UB
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">Complejo UB</span>
          <span className="text-[10px] text-emerald-700 font-semibold">PANEL ADMINISTRADOR</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer text-left transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
