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
    <div className="w-full flex-1 flex flex-col bg-[#293827] text-white font-['Inter',sans-serif]">
      {/* Main Admin Content (Full Width) */}
      <main className="w-full flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
