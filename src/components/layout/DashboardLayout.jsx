import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg font-sans text-slate-900 dark:text-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main content: margen dinámico según estado del sidebar */}
      <div
        className="flex flex-col min-h-screen transition-[padding-left] duration-300 ease-in-out"
        style={{ paddingLeft: sidebarCollapsed ? '4.5rem' : '16rem' }}
      >
        {/* Eliminar el padding en mobile (<lg) */}
        <div className="lg:hidden" style={{ paddingLeft: 0 }} />

        {/* Navbar */}
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
        />

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Responsive fix: en mobile no aplicar el padding-left del sidebar */}
      <style>{`
        @media (max-width: 1023px) {
          .flex.flex-col.min-h-screen {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
