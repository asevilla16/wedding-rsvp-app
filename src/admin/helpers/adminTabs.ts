import { LayoutDashboard, Users, Wallet, Camera, MessageSquareCode, Utensils, Music, Settings } from 'lucide-react';

// The admin panel's sections, defined once. The desktop sidebar, the mobile
// menu and the page header all read from this list, so adding or renaming a
// section only happens here.
//   label:       desktop sidebar name
//   mobileLabel: mobile menu name (a count is appended in brackets for some)
//   title:       page header title
export const ADMIN_TABS = [
  { id: 'overview', label: 'Resumen RSVP', mobileLabel: 'Resumen RSVP', title: 'Resumen & Estadísticas de RSVPs', icon: LayoutDashboard },
  { id: 'guests', label: 'Lista de Invitados', mobileLabel: 'Invitados', title: 'Lista de Invitados', icon: Users },
  { id: 'budget', label: 'Presupuesto y Gastos', mobileLabel: 'Presupuesto & Gastos', title: 'Presupuesto y Control de Gastos', icon: Wallet },
  { id: 'photos', label: 'Galería de Fotos', mobileLabel: 'Galería', title: 'Galería de Fotos', icon: Camera },
  { id: 'messages', label: 'Muro de Mensajes', mobileLabel: 'Mensajes', title: 'Muro de Mensajes', icon: MessageSquareCode },
  { id: 'catering', label: 'Reporte Menú', mobileLabel: 'Reporte Menú', title: 'Reporte de Menú & Alergias', icon: Utensils },
  { id: 'dj', label: 'Música para DJ', mobileLabel: 'Música DJ', title: 'Canciones Recomendadas para DJ', icon: Music },
  { id: 'settings', label: 'Configuración', mobileLabel: 'Configuración', title: 'Configuración del Evento', icon: Settings },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]['id'];

// Header title for a section.
export const getAdminTabTitle = (id: AdminTabId) => ADMIN_TABS.find((t) => t.id === id)?.title ?? '';
