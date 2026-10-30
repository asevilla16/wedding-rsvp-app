import React from 'react';
import { User } from 'firebase/auth';
import { ChevronRight, ExternalLink, LogOut, ShieldCheck, X } from 'lucide-react';
import { ADMIN_TABS, AdminTabId } from '../helpers/adminTabs';

// Optional value shown on the right of a desktop menu item (e.g. guest count,
// budget total). Items without one show an arrow instead.
export type AdminTabBadges = Partial<Record<AdminTabId, React.ReactNode>>;

interface NavItemProps {
  tab: (typeof ADMIN_TABS)[number];
  active: boolean;
  badge?: React.ReactNode;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ tab, active, badge, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
        active
          ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
          : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        <Icon className="w-4 h-4 text-[#D4AF37]" />
        <span>{tab.label}</span>
      </div>
      {badge !== undefined ? (
        <span className="px-2 py-0.5 rounded-full bg-[#154D3D] text-[10px] text-[#D4AF37] font-bold">{badge}</span>
      ) : (
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'opacity-100' : 'opacity-30'}`} />
      )}
    </button>
  );
};

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelect: (tab: AdminTabId) => void;
  badges: AdminTabBadges;
  partnerNames: string;
  currentUser: User | null;
  onViewSite: () => void;
  onLogout: () => void;
}

// Desktop sidebar (md and up).
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelect,
  badges,
  partnerNames,
  currentUser,
  onViewSite,
  onLogout,
}) => (
  <aside className="hidden md:flex flex-col w-64 bg-[#072B21] border-r border-[#154D3D] text-[#FAFAF7] shrink-0 justify-between shadow-xl z-20">
    {/* Sidebar Header */}
    <div className="p-5 border-b border-[#154D3D] space-y-2">
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#105642] to-[#0A382B] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-md">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-base text-[#D4AF37] font-semibold italic tracking-wide">Panel de Novios</h3>
          <p className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-medium">{partnerNames}</p>
        </div>
      </div>
    </div>

    {/* Sidebar Menu Items */}
    <nav className="p-3 space-y-1 overflow-y-auto flex-1">
      <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#D4AF37]/80 font-bold">Menú Principal</div>
      {ADMIN_TABS.map((tab) => (
        <NavItem
          key={tab.id}
          tab={tab}
          active={activeTab === tab.id}
          badge={badges[tab.id]}
          onClick={() => onSelect(tab.id)}
        />
      ))}
    </nav>

    {/* Sidebar Footer */}
    <div className="p-4 border-t border-[#154D3D] space-y-2 bg-[#052018]">
      {currentUser && (
        <div className="flex items-center space-x-2.5 px-2 py-1 text-xs text-emerald-100">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="" className="w-6 h-6 rounded-full border border-[#D4AF37]" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#0F4C3A] flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-[11px] font-medium text-emerald-200">{currentUser.email}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onViewSite}
          className="flex-1 py-2 px-3 rounded-xl bg-[#0F4C3A]/80 hover:bg-[#0F4C3A] text-[#FAFAF7] text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1 border border-[#D4AF37]/30"
          title="Ver invitación pública"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Ver Web</span>
        </button>

        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/40 text-rose-300 text-xs transition-all cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
        </button>
      </div>
    </div>
  </aside>
);

interface AdminMobileMenuProps {
  open: boolean;
  onClose: () => void;
  activeTab: AdminTabId;
  onSelect: (tab: AdminTabId) => void;
  // Shown in brackets after the name, e.g. "Invitados (56)".
  counts: Partial<Record<AdminTabId, number>>;
  onViewSite: () => void;
}

// Slide-out menu for small screens (below md).
export const AdminMobileMenu: React.FC<AdminMobileMenuProps> = ({
  open,
  onClose,
  activeTab,
  onSelect,
  counts,
  onViewSite,
}) => {
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
      <div className="w-72 bg-[#072B21] h-full flex flex-col text-[#FAFAF7] p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#154D3D]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-serif text-base text-[#D4AF37] italic font-semibold">Panel de Novios</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto flex-1">
          {ADMIN_TABS.map((tab) => {
            const IconComp = tab.icon;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelect(tab.id);
                  onClose();
                }}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center space-x-3 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 font-semibold'
                    : 'text-emerald-100/70 hover:bg-[#0A382B]'
                }`}
              >
                <IconComp className="w-4 h-4 text-[#D4AF37]" />
                <span>{count !== undefined ? `${tab.mobileLabel} (${count})` : tab.mobileLabel}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-[#154D3D] space-y-2">
          <button
            onClick={onViewSite}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0F4C3A] text-white text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
            <span>Ir a la Invitación Pública</span>
          </button>
        </div>
      </div>
      {/* Tapping outside the menu closes it */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
