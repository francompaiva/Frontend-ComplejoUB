import React from 'react';

export type AdminSection =
  | 'agenda'
  | 'overview'
  | 'canchas'
  | 'torneo'
  | 'resultados'
  | 'reportes'
  | 'auditoria';

export interface AdminLayoutProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children
}) => {
  return (
    <div className="w-full flex-1 flex flex-col bg-[#f4f6f4] text-slate-900 font-['Inter',sans-serif]">
      <main className="w-full flex-1 flex flex-col min-w-0 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
