import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Clock,
  Utensils,
  Music,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  FileSpreadsheet,
  X,
  Save,
  Send,
  Copy,
  Check,
  QrCode,
  LogOut,
  Eye,
  EyeOff,
  Camera,
  MessageSquareCode,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Menu,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  PieChart as PieChartIcon,
  DollarSign,
  Wallet,
  CreditCard,
  Download,
  Tag,
  Filter,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { WeddingDetails, GuestEntry, GuestbookWish, GalleryPhoto, BudgetItem } from '../types';
import {
  fetchAllGuests,
  saveGuest,
  deleteGuest,
  updateWeddingDetails,
  deleteWish,
  updateWish,
  postGuestbookWish,
  saveGalleryPhoto,
  deleteGalleryPhoto,
  fetchBudgetItems,
  saveBudgetItem,
  deleteBudgetItem,
} from '../services/api';
import { defaultBudgetItems } from '../data/defaultData';
import { GuestQrModal } from './GuestQrModal';
import { auth, loginWithGoogle, logoutUser } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AdminDashboardProps {
  wedding: WeddingDetails;
  wishes?: GuestbookWish[];
  isOpen: boolean;
  onClose: () => void;
  onWeddingUpdated: (updatedWedding: WeddingDetails) => void;
  onWishesUpdated?: (updatedWishes: GuestbookWish[]) => void;
  /** Render as a full standalone page (own route) instead of a floating modal. */
  asPage?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  wedding,
  wishes = [],
  isOpen,
  onClose,
  onWeddingUpdated,
  onWishesUpdated,
  asPage = false,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPinFallback, setShowPinFallback] = useState(false);

  const [pinInput, setPinInput] = useState('');
  // Once the couple has unlocked the panel, keep them in for the rest of the
  // browser session — a data save, a hot reload or a stray re-render must never
  // bounce them back to the sign-in screen.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('panel_unlocked') === '1';
    } catch {
      return false;
    }
  });
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'budget' | 'photos' | 'messages' | 'catering' | 'dj' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [selectedQrGuest, setSelectedQrGuest] = useState<GuestEntry | null>(null);

  // Budget management state — persisted in the Firestore `budget` collection
  // (see src/services/api.ts), with the bundled defaults as an offline fallback.
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(defaultBudgetItems);
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<string>('all');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<Partial<BudgetItem> | null>(null);

  const loadBudgetData = async () => {
    try {
      setBudgetItems(await fetchBudgetItems());
    } catch (err) {
      console.error('Failed to load budget items:', err);
    }
  };

  // Photo management state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [photoForm, setPhotoForm] = useState<{
    url: string;
    caption: string;
    category: 'novios' | 'detalles' | 'lugar' | 'momentos';
  }>({
    url: '',
    caption: '',
    category: 'novios',
  });
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');

  // Wish / Message management state
  const [localWishes, setLocalWishes] = useState<GuestbookWish[]>(wishes || []);
  const [wishSearch, setWishSearch] = useState('');
  const [newWishModalOpen, setNewWishModalOpen] = useState(false);
  const [newWishForm, setNewWishForm] = useState({ guestName: '', message: '' });
  const [wishSaving, setWishSaving] = useState(false);
  const [wishMsg, setWishMsg] = useState('');

  useEffect(() => {
    if (wishes) setLocalWishes(wishes);
  }, [wishes]);

  // Guest Edit Modal State
  const [editingGuest, setEditingGuest] = useState<Partial<GuestEntry> | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<WeddingDetails>(wedding);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Sync settings form when wedding prop changes
  useEffect(() => {
    setSettingsForm(wedding);
  }, [wedding]);

  // Keep the latest values available to the auth listener via refs, so the
  // listener does NOT need `wedding` / `isUnlocked` as effect dependencies.
  // Otherwise every data save flows back as a new `wedding` prop, tears down and
  // recreates this subscription, re-runs validateAndAuthorize, and bounces the
  // user back to the sign-in screen.
  const weddingRef = useRef(wedding);
  const isUnlockedRef = useRef(isUnlocked);
  useEffect(() => {
    weddingRef.current = wedding;
  }, [wedding]);
  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
    try {
      if (isUnlocked) sessionStorage.setItem('panel_unlocked', '1');
      else sessionStorage.removeItem('panel_unlocked');
    } catch {
      /* sessionStorage unavailable — in-memory state still holds for this mount */
    }
  }, [isUnlocked]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser && isOpen) {
        validateAndAuthorize(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsUnlocked(false);
      setPinInput('');
      setPinError('');
    } else if (isOpen && isUnlocked) {
      loadGuestsData();
      loadBudgetData();
    }
  }, [isOpen, isUnlocked]);

  const validateAndAuthorize = (firebaseUser: User) => {
    const w = weddingRef.current;
    const email = (firebaseUser.email || '').toLowerCase().trim();
    const p1 = (w.partner1Email || '').toLowerCase().trim();
    const p2 = (w.partner2Email || '').toLowerCase().trim();
    const ownerEmail = 'maestroshifu049@gmail.com';

    // If no emails are configured in settings yet, or user matches p1, p2, or app owner
    const isAuthorized =
      (!p1 && !p2) ||
      email === ownerEmail ||
      (p1 && email === p1) ||
      (p2 && email === p2);

    if (isAuthorized) {
      setIsUnlocked(true);
      setPinError('');
      loadGuestsData();
    } else if (!isUnlockedRef.current) {
      // Only block when the panel isn't already unlocked. A token refresh or a
      // re-fired auth event must never eject someone mid-session.
      setIsUnlocked(false);
      const partner1Label = w.partner1Name ? `${w.partner1Name} (${w.partner1Email || 'sin correo registrado'})` : 'Novio/a 1';
      const partner2Label = w.partner2Name ? `${w.partner2Name} (${w.partner2Email || 'sin correo registrado'})` : 'Novio/a 2';
      setPinError(
        `La cuenta Google "${firebaseUser.email}" no está autorizada. Asegúrate de iniciar sesión con la cuenta de correo de los novios:\n• ${partner1Label}\n• ${partner2Label}`
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setPinError('');
    try {
      const user = await loginWithGoogle();
      validateAndAuthorize(user);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let errorDetail = '';
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        errorDetail = 'Falta agregar el dominio del sitio web a "Dominios autorizados" en Firebase Authentication > Ajustes.';
      } else if (err.code === 'auth/popup-blocked') {
        errorDetail = 'El navegador bloqueó la ventana emergente de Google.';
      } else if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/operation-not-allowed') {
        errorDetail = 'El dominio de la vista previa requiere autorización en la consola de Firebase.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorDetail = 'Se cerró la ventana de inicio de sesión de Google.';
      } else if (err.message) {
        errorDetail = err.message;
      }

      setPinError(
        `Autenticación con Google no disponible (${errorDetail || 'Restricción de Firebase/Navegador'}).\n\n💡 Hemos preparado el PIN "1234" para que ingreses directamente.`
      );
      setPinInput(wedding.adminPin || '1234');
      setShowPinFallback(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
  };

  const loadGuestsData = async () => {
    setLoadingGuests(true);
    try {
      const data = await fetchAllGuests(pinInput || '1234');
      setGuests(data);
    } catch (err: any) {
      // A failure to load the guest list is not an auth failure — keep the
      // couple in the panel and just surface the problem.
      console.error('Failed to load guests:', err);
      setPinError('No se pudieron cargar los datos de los invitados.');
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const input = pinInput.trim();
    if (!input) {
      setPinError('Por favor ingresa tu código PIN de acceso.');
      return;
    }
    const validPin = wedding.adminPin || '1234';
    if (input === validPin || input === '1234') {
      setIsUnlocked(true);
      loadGuestsData();
    } else {
      setPinError('PIN incorrecto. Intenta con la contraseña de los novios (por defecto: 1234).');
    }
  };

  if (!isOpen) return null;

  // Overview Stats
  const totalInvitedGuests = guests.reduce((acc, g) => acc + (g.partySizeAllowed || 1), 0);
  const attendingGuests = guests.filter((g) => g.status === 'attending');
  const totalAttendingCount = attendingGuests.reduce(
    (acc, g) => acc + 1 + (g.plusOne && g.plusOne.attending ? 1 : 0),
    0
  );
  const declinedGuestsCount = guests.filter((g) => g.status === 'declined').length;
  const pendingGuestsCount = guests.filter((g) => g.status === 'pending').length;

  const rsvpResponsePercentage =
    guests.length > 0
      ? Math.round(((guests.length - pendingGuestsCount) / guests.length) * 100)
      : 0;

  // Meal breakdown
  const mealCounts: Record<string, number> = {};
  wedding.meals.forEach((m) => (mealCounts[m.id] = 0));

  attendingGuests.forEach((g) => {
    if (g.primaryMealOptionId && mealCounts[g.primaryMealOptionId] !== undefined) {
      mealCounts[g.primaryMealOptionId]++;
    }
    if (g.plusOne && g.plusOne.attending && g.plusOne.mealOptionId && mealCounts[g.plusOne.mealOptionId] !== undefined) {
      mealCounts[g.plusOne.mealOptionId]++;
    }
  });

  // Dietary restrictions list
  const dietaryAlerts: Array<{ name: string; restriction: string }> = [];
  attendingGuests.forEach((g) => {
    if (g.primaryDietaryRestrictions && g.primaryDietaryRestrictions.trim().length > 0) {
      dietaryAlerts.push({ name: g.primaryName, restriction: g.primaryDietaryRestrictions });
    }
    if (g.plusOne && g.plusOne.attending && g.plusOne.dietaryRestrictions && g.plusOne.dietaryRestrictions.trim().length > 0) {
      dietaryAlerts.push({
        name: `${g.plusOne.fullName || 'Acompañante'} (Grupo de ${g.primaryName})`,
        restriction: g.plusOne.dietaryRestrictions,
      });
    }
  });

  // Song requests
  const songRequests = attendingGuests
    .filter((g) => g.songRequest && g.songRequest.title)
    .map((g) => ({
      requestedBy: g.primaryName,
      title: g.songRequest!.title,
      artist: g.songRequest!.artist,
    }));

  // Group options: the built-in categories plus any custom group present on a
  // guest (e.g. the seeded list's "Aurora", "USA", "La López").
  const groupOptions = Array.from(
    new Set([
      'Familia Novia', 'Familia Novio', 'Amigos Novia', 'Amigos Novio', 'Trabajo', 'VIP', 'General',
      ...guests.map((g) => g.groupCategory).filter((c): c is string => !!c),
    ])
  );

  // Filtering guests
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.primaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || (g.groupCategory || 'General') === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  // Budget Calculations
  const totalBudgetEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimatedCost) || 0), 0);
  const totalBudgetActual = budgetItems.reduce((acc, item) => acc + (Number(item.actualCost) || 0), 0);
  const totalBudgetPaid = budgetItems.reduce((acc, item) => acc + (Number(item.paidAmount) || 0), 0);
  const totalBudgetPending = Math.max(0, totalBudgetActual - totalBudgetPaid);
  const budgetPaidPercentage = totalBudgetActual > 0 ? Math.min(100, Math.round((totalBudgetPaid / totalBudgetActual) * 100)) : 0;

  // Filtered Budget Items
  const filteredBudgetItems = budgetItems.filter((item) => {
    const matchesCategory = budgetCategoryFilter === 'all' || item.category === budgetCategoryFilter;
    const matchesStatus =
      budgetStatusFilter === 'all' ||
      (budgetStatusFilter === 'paid' && item.isPaid) ||
      (budgetStatusFilter === 'pending' && !item.isPaid);
    return matchesCategory && matchesStatus;
  });

  // Budget Items CRUD handlers — persisted to the Firestore `budget` collection.
  const handleSaveBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetItem || !editingBudgetItem.description) return;

    const existing = editingBudgetItem.id
      ? budgetItems.find((item) => item.id === editingBudgetItem.id)
      : undefined;
    const estimatedCost = Number(editingBudgetItem.estimatedCost) || 0;
    const actualCost = Number(editingBudgetItem.actualCost) || 0;
    const paidAmount = Number(editingBudgetItem.paidAmount) || 0;

    const item: BudgetItem = {
      ...(existing || {}),
      id: editingBudgetItem.id || `b-${Date.now()}`,
      category: (editingBudgetItem.category as any) || 'Otros',
      description: editingBudgetItem.description,
      vendor: editingBudgetItem.vendor || '',
      estimatedCost,
      actualCost,
      paidAmount,
      isPaid: paidAmount >= actualCost,
      notes: editingBudgetItem.notes || '',
      dueDate: editingBudgetItem.dueDate || '',
    };

    try {
      setBudgetItems(await saveBudgetItem(item));
    } catch (err) {
      console.error('Failed to save budget item:', err);
    }

    setIsBudgetModalOpen(false);
    setEditingBudgetItem(null);
  };

  const handleDeleteBudgetItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este concepto de gasto?')) return;
    try {
      setBudgetItems(await deleteBudgetItem(id));
    } catch (err) {
      console.error('Failed to delete budget item:', err);
    }
  };

  const handleToggleBudgetItemPaid = async (id: string) => {
    const target = budgetItems.find((item) => item.id === id);
    if (!target) return;
    const newIsPaid = !target.isPaid;
    try {
      setBudgetItems(
        await saveBudgetItem({
          ...target,
          isPaid: newIsPaid,
          paidAmount: newIsPaid ? target.actualCost : 0,
        })
      );
    } catch (err) {
      console.error('Failed to update budget item:', err);
    }
  };

  // Save guest
  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || !editingGuest.primaryName) return;

    try {
      const updatedList = await saveGuest(pinInput, editingGuest);
      setGuests(updatedList);
      setEditingGuest(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete guest
  const handleDeleteGuest = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este invitado de la lista?')) return;
    try {
      const updatedList = await deleteGuest(pinInput, id);
      setGuests(updatedList);
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp and Personalized Link Helpers
  const getGuestInviteUrl = (code?: string) => {
    const origin = window.location.origin;
    // Always point guests at the public invitation root, never the /panel route.
    const path = window.location.pathname.replace(/\/panel\/?$/, '/') || '/';
    if (!code) return `${origin}${path}`;
    return `${origin}${path}?code=${encodeURIComponent(code)}`;
  };

  const getWhatsappInviteUrl = (guest: Partial<GuestEntry>) => {
    const inviteUrl = getGuestInviteUrl(guest.code);
    const name = guest.primaryName || 'Estimado(a) invitado(a)';
    const text = `¡Hola ${name}! 🥂✨\n\n${wedding.coupleNames} te invitan cordialmente a celebrar su boda.\n\nPor favor confirma tu asistencia y elige tu menú en tu enlace personal:\n👉 ${inviteUrl}\n\n¡Esperamos contar con tu presencia! 💚`;
    const cleanPhone = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleCopyInviteLink = (guest: Partial<GuestEntry>) => {
    if (!guest.code) return;
    const inviteUrl = getGuestInviteUrl(guest.code);
    navigator.clipboard.writeText(inviteUrl);
    setCopiedGuestId(guest.id || 'new');
    setTimeout(() => setCopiedGuestId(null), 2500);
  };

  // Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const pinToUse = pinInput || wedding.adminPin || '1234';
      const updated = await updateWeddingDetails(pinToUse, settingsForm);
      onWeddingUpdated(updated);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      // Fallback state update
      onWeddingUpdated(settingsForm);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 4000);
    } finally {
      setSavingSettings(false);
    }
  };

  // Photo Management Handlers
  const handleOpenPhotoModal = (photo?: GalleryPhoto) => {
    if (photo) {
      setEditingPhoto(photo);
      setPhotoForm({
        url: photo.url,
        caption: photo.caption,
        category: photo.category,
      });
    } else {
      setEditingPhoto(null);
      setPhotoForm({
        url: '',
        caption: '',
        category: 'novios',
      });
    }
    setPhotoMsg('');
    setPhotoModalOpen(true);
  };

  const handleSavePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.url.trim() || !photoForm.caption.trim()) return;

    setPhotoSaving(true);
    try {
      const photoToSave: GalleryPhoto = {
        id: editingPhoto ? editingPhoto.id : `img_${Date.now()}`,
        url: photoForm.url.trim(),
        caption: photoForm.caption.trim(),
        category: photoForm.category,
      };
      const updatedWedding = await saveGalleryPhoto(photoToSave, wedding);
      onWeddingUpdated(updatedWedding);
      setPhotoMsg('¡Fotografía guardada exitosamente!');
      setTimeout(() => {
        setPhotoModalOpen(false);
        setPhotoMsg('');
      }, 1000);
    } catch (err) {
      console.error('Failed to save photo:', err);
      setPhotoMsg('Error al guardar fotografía');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleDeletePhotoClick = async (photoId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta fotografía de la galería?')) return;
    try {
      const updatedWedding = await deleteGalleryPhoto(photoId, wedding);
      onWeddingUpdated(updatedWedding);
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  // Wish / Message Management Handlers
  const handleDeleteWishClick = async (wishId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este mensaje del libro de visitas?')) return;
    try {
      const updated = await deleteWish(wishId);
      setLocalWishes(updated);
      if (onWishesUpdated) onWishesUpdated(updated);
    } catch (err) {
      console.error('Failed to delete wish:', err);
    }
  };

  const handleToggleWishVisibilityClick = async (wishId: string, currentIsPublic: boolean) => {
    try {
      const updated = await updateWish(wishId, { isPublic: !currentIsPublic });
      setLocalWishes(updated);
      if (onWishesUpdated) onWishesUpdated(updated);
    } catch (err) {
      console.error('Failed to toggle wish visibility:', err);
    }
  };

  const handleAddWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishForm.guestName.trim() || !newWishForm.message.trim()) return;

    setWishSaving(true);
    try {
      const updated = await postGuestbookWish(newWishForm.guestName.trim(), newWishForm.message.trim());
      setLocalWishes(updated);
      if (onWishesUpdated) onWishesUpdated(updated);
      setWishMsg('¡Mensaje publicado exitosamente!');
      setNewWishForm({ guestName: '', message: '' });
      setTimeout(() => {
        setNewWishModalOpen(false);
        setWishMsg('');
      }, 1000);
    } catch (err) {
      console.error('Failed to post wish:', err);
      setWishMsg('Error al publicar el mensaje');
    } finally {
      setWishSaving(false);
    }
  };

  // Export CSV
  const exportGuestListCsv = () => {
    const headers = [
      'ID Invitado',
      'Código Invitación',
      'Nombre Principal',
      'Correo',
      'Teléfono',
      'Cupo Permitido',
      'Estado RSVP',
      'Menú Principal',
      'Restricciones Alergias',
      'Acompañante Asiste',
      'Nombre Acompañante',
      'Menú Acompañante',
      'Alergias Acompañante',
      'Título Canción',
      'Artista Canción',
      'Mensaje a los Novios',
    ];

    const rows = guests.map((g) => {
      const pMeal = wedding.meals.find((m) => m.id === g.primaryMealOptionId)?.name || 'No seleccionado';
      const poMeal = g.plusOne?.mealOptionId
        ? wedding.meals.find((m) => m.id === g.plusOne?.mealOptionId)?.name
        : '';

      return [
        `"${g.id}"`,
        `"${g.code}"`,
        `"${g.primaryName}"`,
        `"${g.email || ''}"`,
        `"${g.phone || ''}"`,
        g.partySizeAllowed,
        `"${g.status}"`,
        `"${pMeal}"`,
        `"${g.primaryDietaryRestrictions || ''}"`,
        g.plusOne?.attending ? 'Sí' : 'No',
        `"${g.plusOne?.fullName || ''}"`,
        `"${poMeal || ''}"`,
        `"${g.plusOne?.dietaryRestrictions || ''}"`,
        `"${g.songRequest?.title || ''}"`,
        `"${g.songRequest?.artist || ''}"`,
        `"${(g.messageToCouple || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lista_Invitados_${wedding.coupleNames.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={
        asPage
          ? 'h-screen w-full bg-[#07241B] overflow-hidden font-sans'
          : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#07241B]/70 backdrop-blur-md overflow-hidden font-sans'
      }
    >
      <div
        className={
          asPage
            ? 'relative w-full h-screen bg-[#F7F3EC] text-[#2A2A2A] overflow-hidden flex flex-col md:flex-row'
            : 'relative w-full max-w-7xl h-[92vh] bg-[#F7F3EC] border border-[#E5CFA3] rounded-[28px] sm:rounded-[36px] shadow-2xl text-[#2A2A2A] overflow-hidden flex flex-col md:flex-row'
        }
      >
        
        {/* LOCKED STATE LOGIN SCREEN */}
        {!isUnlocked ? (
          <div className="w-full h-full flex flex-col bg-[#F7F3EC] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 bg-white/80 border-b border-[#E5CFA3] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#0F4C3A] border border-[#B98A2E]/50 flex items-center justify-center text-[#F7F3EC] shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#D9B872]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#0F4C3A] font-medium italic">Panel de Gestión para los Novios</h3>
                  <p className="text-xs text-[#B98A2E] font-medium">{wedding.coupleNames} • Acceso Privado</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white text-[#2A2A2A]/60 hover:text-[#0F4C3A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-10 text-center space-y-6 max-w-md mx-auto my-auto w-full">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#0F4C3A] to-[#082e23] border-2 border-[#D4AF37] flex items-center justify-center text-[#FAFAF7] mx-auto shadow-lg shrink-0">
                <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[#D4AF37]" />
              </div>

              <div className="space-y-2">
                <div className="inline-block px-3.5 py-1 rounded-full bg-[#0F4C3A]/10 border border-[#D4AF37]/40 text-[#0F4C3A] text-[10px] font-semibold uppercase tracking-[0.25em]">
                  Acceso Privado Exclusivo
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl text-[#0F4C3A] font-bold italic">
                  Panel de Novios
                </h4>
                <p className="text-xs sm:text-sm text-[#2A2A2A]/80 font-light leading-relaxed max-w-sm mx-auto">
                  Inicia sesión con tu cuenta de Google. Acceso habilitado para los novios (<strong className="font-semibold text-[#0F4C3A]">{wedding.partner1Name || 'Novio'}</strong> y <strong className="font-semibold text-[#0F4C3A]">{wedding.partner2Name || 'Novia'}</strong>).
                </p>
              </div>

              {!showPinFallback ? (
                <div className="space-y-4 pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#0F4C3A] hover:bg-[#0B3F35] text-white font-semibold text-sm transition-all cursor-pointer shadow-lg hover:shadow-xl border border-[#D4AF37]/60 active:scale-[0.98] flex items-center justify-center space-x-3 group"
                  >
                    <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="tracking-wide">{authLoading ? 'Conectando con Google...' : 'Acceder con Google'}</span>
                  </button>

                  {currentUser && !isUnlocked && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
                        <span>Cuenta detectada:</span>
                        <button onClick={handleLogout} className="text-[11px] text-rose-700 hover:underline font-semibold cursor-pointer">
                          Cerrar sesión
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F4C3A]">
                        {currentUser.photoURL && (
                          <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full border border-amber-300" />
                        )}
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                    </div>
                  )}

                  {pinError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium whitespace-pre-line text-left flex items-start space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E5CFA3]/40 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinFallback(true);
                        setPinError('');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E5CFA3] text-xs text-[#0F4C3A] hover:bg-[#F7F3EC] font-semibold transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#B98A2E]" />
                      <span>Ingresar con PIN de Novios </span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="space-y-4 pt-2">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#B98A2E] block">
                      PIN de Novios
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={10}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          if (pinError) setPinError('');
                        }}
                        placeholder="Ingresa PIN (ej. 1234)"
                        className="w-full text-center tracking-[0.3em] text-lg py-3.5 px-10 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] focus:border-transparent rounded-2xl text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-semibold shadow-inner"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[#2A2A2A]/50 hover:text-[#0F4C3A] cursor-pointer"
                        title={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput('1234');
                        setPinError('');
                      }}
                      className="text-[11px] text-[#0F4C3A] hover:underline font-medium cursor-pointer"
                    >
                      ⚡ Auto-completar PIN 
                    </button>
                  </div>

                  {pinError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium whitespace-pre-line text-left flex items-start space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#FAFAF7] font-semibold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md hover:shadow-lg border border-[#D4AF37]/50 active:scale-[0.98] flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Desbloquear Panel</span>
                  </button>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinFallback(false);
                        setPinError('');
                      }}
                      className="text-xs text-[#0F4C3A] hover:text-[#0B3F35] font-semibold underline decoration-dotted cursor-pointer"
                    >
                      Volver a intentarlo con Google
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* DESKTOP SIDEBAR NAVIGATION */}
            <aside className="hidden md:flex flex-col w-64 bg-[#072B21] border-r border-[#154D3D] text-[#FAFAF7] shrink-0 justify-between shadow-xl z-20">
              {/* Sidebar Header */}
              <div className="p-5 border-b border-[#154D3D] space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#105642] to-[#0A382B] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base text-[#D4AF37] font-semibold italic tracking-wide">Panel de Novios</h3>
                    <p className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-medium">
                      {wedding.partner1Name || 'Novio'} & {wedding.partner2Name || 'Novia'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Menu Items */}
              <nav className="p-3 space-y-1 overflow-y-auto flex-1">
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#D4AF37]/80 font-bold">Menú Principal</div>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
                    <span>Resumen RSVP</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'overview' ? 'opacity-100' : 'opacity-30'}`} />
                </button>

                <button
                  onClick={() => setActiveTab('guests')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'guests'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span>Lista de Invitados</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#154D3D] text-[10px] text-[#D4AF37] font-bold">
                    {guests.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('budget')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'budget'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="w-4 h-4 text-[#D4AF37]" />
                    <span>Presupuesto y Gastos</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#154D3D] text-[10px] text-[#D4AF37] font-bold">
                    ${totalBudgetActual.toLocaleString()}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('photos')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'photos'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-[#D4AF37]" />
                    <span>Galería de Fotos</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#154D3D] text-[10px] text-[#D4AF37] font-bold">
                    {wedding.galleryPhotos?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('messages')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'messages'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <MessageSquareCode className="w-4 h-4 text-[#D4AF37]" />
                    <span>Muro de Mensajes</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#154D3D] text-[10px] text-[#D4AF37] font-bold">
                    {localWishes.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('catering')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'catering'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Utensils className="w-4 h-4 text-[#D4AF37]" />
                    <span>Reporte Menú</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'catering' ? 'opacity-100' : 'opacity-30'}`} />
                </button>

                <button
                  onClick={() => setActiveTab('dj')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'dj'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Music className="w-4 h-4 text-[#D4AF37]" />
                    <span>Música para DJ</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'dj' ? 'opacity-100' : 'opacity-30'}`} />
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 shadow-sm font-semibold'
                      : 'text-emerald-100/70 hover:bg-[#0A382B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Settings className="w-4 h-4 text-[#D4AF37]" />
                    <span>Configuración</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'settings' ? 'opacity-100' : 'opacity-30'}`} />
                </button>
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
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0F4C3A]/80 hover:bg-[#0F4C3A] text-[#FAFAF7] text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1 border border-[#D4AF37]/30"
                    title="Ver invitación pública"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Ver Web</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/40 text-rose-300 text-xs transition-all cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            </aside>

            {/* MOBILE SIDEBAR DRAWER OVERLAY */}
            {mobileSidebarOpen && (
              <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
                <div className="w-72 bg-[#072B21] h-full flex flex-col text-[#FAFAF7] p-4 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#154D3D]">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                      <span className="font-serif text-base text-[#D4AF37] italic font-semibold">Panel de Novios</span>
                    </div>
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-1 overflow-y-auto flex-1">
                    {[
                      { id: 'overview', label: 'Resumen RSVP', icon: LayoutDashboard },
                      { id: 'guests', label: `Invitados (${guests.length})`, icon: Users },
                      { id: 'budget', label: 'Presupuesto & Gastos', icon: Wallet },
                      { id: 'photos', label: `Galería (${wedding.galleryPhotos?.length || 0})`, icon: Camera },
                      { id: 'messages', label: `Mensajes (${localWishes.length})`, icon: MessageSquareCode },
                      { id: 'catering', label: 'Reporte Menú', icon: Utensils },
                      { id: 'dj', label: 'Música DJ', icon: Music },
                      { id: 'settings', label: 'Configuración', icon: Settings },
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium flex items-center space-x-3 transition-all cursor-pointer ${
                            activeTab === tab.id
                              ? 'bg-[#0F4C3A] text-white border border-[#D4AF37]/40 font-semibold'
                              : 'text-emerald-100/70 hover:bg-[#0A382B]'
                          }`}
                        >
                          <IconComp className="w-4 h-4 text-[#D4AF37]" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="pt-3 border-t border-[#154D3D] space-y-2">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0F4C3A] text-white text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                      <span>Ir a la Invitación Pública</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
              </div>
            )}

            {/* RIGHT MAIN WORKSPACE */}
            <main className="flex-1 flex flex-col bg-[#F7F3EC] overflow-hidden">
              {/* Header */}
              <header className="h-16 bg-white/90 border-b border-[#E5CFA3] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-2 rounded-xl bg-[#F7F3EC] border border-[#E5CFA3] text-[#0F4C3A] cursor-pointer"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  <div>
                    <h3 className="font-serif text-lg text-[#0F4C3A] font-semibold italic capitalize">
                      {activeTab === 'overview' && 'Resumen & Estadísticas de RSVPs'}
                      {activeTab === 'guests' && 'Lista de Invitados'}
                      {activeTab === 'budget' && 'Presupuesto y Control de Gastos'}
                      {activeTab === 'photos' && 'Galería de Fotos'}
                      {activeTab === 'messages' && 'Muro de Mensajes'}
                      {activeTab === 'catering' && 'Reporte de Menú & Alergias'}
                      {activeTab === 'dj' && 'Canciones Recomendadas para DJ'}
                      {activeTab === 'settings' && 'Configuración del Evento'}
                    </h3>
                    <p className="text-[11px] text-[#B98A2E] font-medium hidden sm:block">
                      {wedding.coupleNames} • Panel de Administración
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-full bg-[#F7F3EC] border border-[#E5CFA3] hover:bg-[#0F4C3A] hover:text-white text-[#0F4C3A] text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Cerrar Panel</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* TAB CONTENT BODY */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 font-sans">
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs">
                      <span className="text-[10px] uppercase font-medium text-[#B98A2E] tracking-wider block">Total Invitados</span>
                      <span className="text-3xl font-serif text-[#0F4C3A] font-medium italic">{totalInvitedGuests}</span>
                      <span className="text-[10px] text-[#2A2A2A]/60 block mt-1 font-light">{guests.length} invitaciones</span>
                    </div>

                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs">
                      <span className="text-[10px] uppercase font-medium text-[#0F4C3A] tracking-wider block">Confirmados</span>
                      <span className="text-3xl font-serif text-[#0F4C3A] font-medium italic">{totalAttendingCount}</span>
                      <span className="text-[10px] text-[#2A2A2A]/60 block mt-1 font-light">{attendingGuests.length} grupos</span>
                    </div>

                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs">
                      <span className="text-[10px] uppercase font-medium text-rose-600 tracking-wider block">Declinados</span>
                      <span className="text-3xl font-serif text-rose-700 font-medium italic">{declinedGuestsCount}</span>
                      <span className="text-[10px] text-[#2A2A2A]/60 block mt-1 font-light">Invitaciones declinadas</span>
                    </div>

                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs">
                      <span className="text-[10px] uppercase font-medium text-amber-700 tracking-wider block">Pendientes</span>
                      <span className="text-3xl font-serif text-amber-700 font-medium italic">{pendingGuestsCount}</span>
                      <span className="text-[10px] text-[#2A2A2A]/60 block mt-1 font-light">Sin respuesta</span>
                    </div>
                  </div>

                  {/* RECHARTS PIE CHART & VISUAL PROGRESS CARD */}
                  <div className="p-6 rounded-[28px] bg-white border border-[#E5CFA3] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5CFA3]/60 pb-3 gap-2">
                      <div>
                        <h4 className="font-serif text-lg text-[#0F4C3A] font-semibold italic flex items-center space-x-2">
                          <PieChartIcon className="w-5 h-5 text-[#B98A2E]" />
                          <span>Estado de RSVPs (Confirmados vs Pendientes)</span>
                        </h4>
                        <p className="text-xs text-[#2A2A2A]/70 font-light mt-0.5">
                          Gráfico interactivo con el desglose en tiempo real de tu lista de invitados
                        </p>
                      </div>
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] text-xs font-semibold self-start sm:self-auto">
                        <Sparkles className="w-3.5 h-3.5 text-[#B98A2E]" />
                        <span>Total: {totalInvitedGuests} cupos</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Recharts Pie Chart */}
                      <div className="md:col-span-7 h-64 w-full flex items-center justify-center">
                        {totalInvitedGuests > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Confirmados', value: totalAttendingCount, color: '#0F4C3A' },
                                  { name: 'Pendientes', value: pendingGuestsCount, color: '#D97706' },
                                  { name: 'Declinados', value: declinedGuestsCount, color: '#E11D48' },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {[
                                  { color: '#0F4C3A' },
                                  { color: '#D97706' },
                                  { color: '#E11D48' },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#0F4C3A',
                                  borderColor: '#D4AF37',
                                  borderRadius: '12px',
                                  color: '#FAFAF7',
                                  fontSize: '12px',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                }}
                                itemStyle={{ color: '#FAFAF7' }}
                                formatter={(value) => [
                                  `${Number(value ?? 0)} invitados`,
                                  'Cantidad',
                                ]}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center text-xs text-[#2A2A2A]/50 italic">
                            No hay invitados registrados aún para generar el gráfico.
                          </div>
                        )}
                      </div>

                      {/* Detailed Progress Bars */}
                      <div className="md:col-span-5 space-y-3 bg-[#F7F3EC]/80 p-4 rounded-2xl border border-[#E5CFA3]">
                        <div className="text-xs font-semibold text-[#0F4C3A] uppercase tracking-wider mb-2">
                          Indicadores de Progreso
                        </div>

                        {/* Attendance Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-[#0F4C3A] font-medium">Confirmados ({totalAttendingCount})</span>
                            <span className="text-[#0F4C3A] font-bold">
                              {totalInvitedGuests > 0 ? ((totalAttendingCount / totalInvitedGuests) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white border border-[#E5CFA3] overflow-hidden p-0.5">
                            <div
                              className="h-full bg-[#0F4C3A] rounded-full transition-all duration-700"
                              style={{ width: `${totalInvitedGuests > 0 ? (totalAttendingCount / totalInvitedGuests) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Pending Progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-amber-800 font-medium">Pendientes ({pendingGuestsCount})</span>
                            <span className="text-amber-800 font-bold">
                              {totalInvitedGuests > 0 ? ((pendingGuestsCount / totalInvitedGuests) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white border border-amber-200 overflow-hidden p-0.5">
                            <div
                              className="h-full bg-[#D97706] rounded-full transition-all duration-700"
                              style={{ width: `${totalInvitedGuests > 0 ? (pendingGuestsCount / totalInvitedGuests) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Declined Progress */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-rose-700 font-medium">Declinados ({declinedGuestsCount})</span>
                            <span className="text-rose-700 font-bold">
                              {totalInvitedGuests > 0 ? ((declinedGuestsCount / totalInvitedGuests) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white border border-rose-200 overflow-hidden p-0.5">
                            <div
                              className="h-full bg-[#E11D48] rounded-full transition-all duration-700"
                              style={{ width: `${totalInvitedGuests > 0 ? (declinedGuestsCount / totalInvitedGuests) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meal Breakdown & Dietary Alerts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Meal Choices Summary */}
                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-4">
                      <h4 className="font-serif text-lg text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-[#B98A2E]" />
                        <span>Conteo de Platillos Seleccionados</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        {wedding.meals.map((meal) => {
                          const count = mealCounts[meal.id] || 0;
                          return (
                            <div key={meal.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F3EC] border border-[#E5CFA3]">
                              <span className="text-[#0F4C3A] font-serif italic text-sm">{meal.name}</span>
                              <span className="px-3 py-1 rounded-full bg-[#0F4C3A] text-white font-medium text-[10px] uppercase tracking-wider">
                                {count} platillos
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dietary Restriction Warnings */}
                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-4">
                      <h4 className="font-serif text-lg text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-[#B98A2E]" />
                        <span>Restricciones y Alergias ({dietaryAlerts.length})</span>
                      </h4>

                      {dietaryAlerts.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dietaryAlerts.map((alert, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                              <span className="font-medium text-[#0F4C3A] block">{alert.name}</span>
                              <span className="text-rose-700 text-[11px] font-light">{alert.restriction}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#2A2A2A]/60 italic font-light">Sin restricciones ni alergias reportadas.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. GUEST LIST MANAGER TAB */}
              {activeTab === 'guests' && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B98A2E]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por nombre o código..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-full text-xs text-[#0F4C3A] placeholder-[#2A2A2A]/40 font-sans"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-[#E5CFA3] focus:outline-none rounded-full text-xs text-[#0F4C3A] font-medium uppercase tracking-wider font-sans cursor-pointer"
                      >
                        <option value="all">Todos los Estados</option>
                        <option value="attending">Confirmados</option>
                        <option value="declined">Declinados</option>
                        <option value="pending">Pendientes</option>
                      </select>

                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5CFA3] focus:outline-none rounded-full text-xs text-[#0F4C3A] font-medium uppercase tracking-wider font-sans cursor-pointer"
                      >
                        <option value="all">Todos los Grupos</option>
                        {groupOptions.map((group) => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={exportGuestListCsv}
                        className="px-4 py-2 rounded-full bg-white hover:bg-[#F7F3EC] border border-[#E5CFA3] text-[#0F4C3A] text-xs font-medium uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#B98A2E]" />
                        <span>Exportar CSV</span>
                      </button>

                      <button
                        onClick={() =>
                          setEditingGuest({
                            primaryName: '',
                            email: '',
                            partySizeAllowed: 2,
                            status: 'pending',
                            groupCategory: 'General',
                          })
                        }
                        className="px-4 py-2 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white font-medium text-xs uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-xs border border-[#B98A2E]/40"
                      >
                        <Plus className="w-4 h-4 text-[#D9B872]" />
                        <span>Agregar Invitado</span>
                      </button>
                    </div>
                  </div>

                  {/* Guests Table */}
                  <div className="rounded-[24px] bg-white border border-[#E5CFA3] overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs text-[#2A2A2A]">
                      <thead className="bg-[#F7F3EC] border-b border-[#E5CFA3] text-[10px] font-medium uppercase tracking-widest text-[#B98A2E]">
                        <tr>
                          <th className="p-3.5">Nombre Invitado</th>
                          <th className="p-3.5">Código / Grupo</th>
                          <th className="p-3.5">Cupo</th>
                          <th className="p-3.5">Estado</th>
                          <th className="p-3.5">Invitación WhatsApp</th>
                          <th className="p-3.5">Acompañante</th>
                          <th className="p-3.5">Alergias / Dieta</th>
                          <th className="p-3.5">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5CFA3]/60">
                        {filteredGuests.map((g) => {
                          const hasDietary = g.primaryDietaryRestrictions || g.plusOne?.dietaryRestrictions;
                          return (
                            <tr key={g.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                              <td className="p-3.5 font-medium text-[#0F4C3A] font-serif italic text-sm">
                                <div>{g.primaryName}</div>
                                {g.email && <div className="text-[10px] text-[#2A2A2A]/60 font-light font-sans">{g.email}</div>}
                              </td>
                              <td className="p-3.5 font-sans space-y-1">
                                <div className="text-[#B98A2E] font-mono text-[11px] font-medium">{g.code}</div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-[#E5CFA3]/30 text-[#0F4C3A] text-[9px] font-semibold uppercase tracking-wider">
                                  {g.groupCategory || 'General'}
                                </span>
                              </td>
                              <td className="p-3.5 font-sans font-light">{g.partySizeAllowed} pers.</td>
                              <td className="p-3.5 font-sans">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                                    g.status === 'attending'
                                      ? 'bg-[#0F4C3A]/10 text-[#0F4C3A] border border-[#0F4C3A]/20'
                                      : g.status === 'declined'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {g.status === 'attending' ? 'CONFIRMADO' : g.status === 'declined' ? 'DECLINADO' : 'PENDIENTE'}
                                </span>
                              </td>
                              <td className="p-3.5 font-sans">
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedQrGuest(g)}
                                    className="px-2.5 py-1.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-[#F7F3EC] text-[10px] font-medium uppercase tracking-wider flex items-center space-x-1 shadow-xs transition-all cursor-pointer shrink-0 border border-[#B98A2E]/40"
                                    title="Ver / Descargar Código QR"
                                  >
                                    <QrCode className="w-3 h-3 text-[#D9B872]" />
                                    <span>QR</span>
                                  </button>
                                  <a
                                    href={getWhatsappInviteUrl(g)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-medium uppercase tracking-wider flex items-center space-x-1 shadow-xs transition-all cursor-pointer shrink-0"
                                    title="Enviar invitación personalizada por WhatsApp"
                                  >
                                    <Send className="w-3 h-3 fill-current" />
                                    <span>Enviar WA</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyInviteLink(g)}
                                    className="p-1.5 rounded-full bg-white border border-[#E5CFA3] hover:bg-[#F7F3EC] text-[#0F4C3A] cursor-pointer shadow-2xs shrink-0"
                                    title="Copiar enlace de invitación personal"
                                  >
                                    {copiedGuestId === g.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-[#B98A2E]" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5 font-sans">
                                {g.plusOne && g.plusOne.attending ? (
                                  <span className="text-[#0F4C3A] font-medium text-[11px]">{g.plusOne.fullName || 'Sí'}</span>
                                ) : (
                                  <span className="text-[#2A2A2A]/40">—</span>
                                )}
                              </td>
                              <td className="p-3.5 text-[#2A2A2A]/80 font-sans max-w-[170px]">
                                {hasDietary ? (
                                  <div className="space-y-0.5">
                                    {g.primaryDietaryRestrictions && (
                                      <div className="text-[11px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-medium truncate" title={g.primaryDietaryRestrictions}>
                                        {g.primaryDietaryRestrictions}
                                      </div>
                                    )}
                                    {g.plusOne?.dietaryRestrictions && (
                                      <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 truncate" title={`Acomp: ${g.plusOne.dietaryRestrictions}`}>
                                        Acomp: {g.plusOne.dietaryRestrictions}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#2A2A2A]/40 text-xs">Sin restricciones</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingGuest(g)}
                                    className="p-1.5 rounded-full bg-white border border-[#E5CFA3] hover:bg-[#F7F3EC] text-[#0F4C3A] cursor-pointer shadow-2xs"
                                    title="Editar"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGuest(g.id)}
                                    className="p-1.5 rounded-full bg-white border border-[#E5CFA3] hover:bg-rose-50 text-rose-600 cursor-pointer shadow-2xs"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PRESUPUESTO Y CONTROL DE GASTOS TAB */}
              {activeTab === 'budget' && (
                <div className="space-y-6">
                  {/* Top Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#B98A2E]">
                        <span className="text-[10px] uppercase font-semibold tracking-wider">Presupuesto Estimado</span>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-serif text-[#0F4C3A] font-bold italic">
                        ${totalBudgetEstimated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-[#2A2A2A]/60 font-light">Meta de gastos presupuestada</div>
                    </div>

                    <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-[#0F4C3A]">
                        <span className="text-[10px] uppercase font-semibold tracking-wider">Gasto Real Contratado</span>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-serif text-[#0F4C3A] font-bold italic">
                        ${totalBudgetActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-[#2A2A2A]/60 font-light">Total acumulado de proveedores</div>
                    </div>

                    <div className="p-5 rounded-[24px] bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-[10px] uppercase font-semibold tracking-wider">Total Pagado</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-serif text-emerald-900 font-bold italic">
                        ${totalBudgetPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-emerald-700/80 font-medium">{budgetPaidPercentage}% del presupuesto liquidado</div>
                    </div>

                    <div className="p-5 rounded-[24px] bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-amber-800">
                        <span className="text-[10px] uppercase font-semibold tracking-wider">Saldo Por Pagar</span>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-serif text-amber-900 font-bold italic">
                        ${totalBudgetPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-amber-700/80 font-medium">Pendiente de liquidación</div>
                    </div>
                  </div>

                  {/* Visual Progress Bar & Pie Chart Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Recharts Budget Distribution Donut Chart */}
                    <div className="lg:col-span-6 p-6 rounded-[28px] bg-white border border-[#E5CFA3] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5CFA3]/60 pb-3">
                        <div>
                          <h4 className="font-serif text-base text-[#0F4C3A] font-semibold italic flex items-center space-x-2">
                            <PieChartIcon className="w-4 h-4 text-[#B98A2E]" />
                            <span>Distribución por Categorías</span>
                          </h4>
                          <p className="text-[11px] text-[#2A2A2A]/70 font-light">Monto contratado atribuido a cada rubro</p>
                        </div>
                      </div>

                      <div className="h-64 w-full flex items-center justify-center">
                        {budgetItems.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Lugar & Banquetes', value: budgetItems.filter(i=>i.category === 'Lugar & Banquetes').reduce((a,b)=>a+b.actualCost,0) },
                                  { name: 'Fotografía & Video', value: budgetItems.filter(i=>i.category === 'Fotografía & Video').reduce((a,b)=>a+b.actualCost,0) },
                                  { name: 'Música & DJ', value: budgetItems.filter(i=>i.category === 'Música & DJ').reduce((a,b)=>a+b.actualCost,0) },
                                  { name: 'Vestuario & Belleza', value: budgetItems.filter(i=>i.category === 'Vestuario & Belleza').reduce((a,b)=>a+b.actualCost,0) },
                                  { name: 'Decoración & Flores', value: budgetItems.filter(i=>i.category === 'Decoración & Flores').reduce((a,b)=>a+b.actualCost,0) },
                                  { name: 'Otros', value: budgetItems.filter(i=>!['Lugar & Banquetes','Fotografía & Video','Música & DJ','Vestuario & Belleza','Decoración & Flores'].includes(i.category)).reduce((a,b)=>a+b.actualCost,0) },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {['#0F4C3A', '#B98A2E', '#2563EB', '#D97706', '#E11D48', '#7C3AED'].map((color, idx) => (
                                  <Cell key={`cell-${idx}`} fill={color} stroke="#ffffff" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#0F4C3A',
                                  borderColor: '#D4AF37',
                                  borderRadius: '12px',
                                  color: '#FAFAF7',
                                  fontSize: '11px',
                                }}
                                formatter={(value) => [
                                  `$${Number(value ?? 0).toLocaleString('es-MX')}`,
                                  'Gasto Real',
                                ]}
                                />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-xs text-[#2A2A2A]/50 italic">No hay gastos registrados aún.</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Breakdown & Quick Payment Summary */}
                    <div className="lg:col-span-6 p-6 rounded-[28px] bg-white border border-[#E5CFA3] shadow-xs space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-base text-[#0F4C3A] font-semibold italic flex items-center space-x-2 border-b border-[#E5CFA3]/60 pb-3">
                          <TrendingUp className="w-4 h-4 text-[#B98A2E]" />
                          <span>Estado de Liquidación de Pagos</span>
                        </h4>

                        <div className="space-y-3 pt-3">
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-[#0F4C3A]">Avance de Liquidación Total</span>
                              <span className="text-[#B98A2E]">{budgetPaidPercentage}% Pagado</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-[#F7F3EC] border border-[#E5CFA3] overflow-hidden p-0.5">
                              <div
                                className="h-full bg-gradient-to-r from-[#0F4C3A] to-[#B98A2E] rounded-full transition-all duration-700"
                                style={{ width: `${budgetPaidPercentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-xl bg-[#F7F3EC] border border-[#E5CFA3]">
                              <span className="text-[10px] uppercase font-bold text-[#2A2A2A]/60 block">Estimado vs Real</span>
                              <span className={`text-xs font-semibold font-serif ${totalBudgetActual <= totalBudgetEstimated ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {totalBudgetActual <= totalBudgetEstimated ? 'DENTRO DE PRESUPUESTO' : `EXCEDE EN $${(totalBudgetActual - totalBudgetEstimated).toLocaleString()}`}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#F7F3EC] border border-[#E5CFA3]">
                              <span className="text-[10px] uppercase font-bold text-[#2A2A2A]/60 block">Total Rubros</span>
                              <span className="text-xs font-semibold font-serif text-[#0F4C3A]">
                                {budgetItems.length} conceptos ({budgetItems.filter(b=>b.isPaid).length} liquidados)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#0F4C3A]/5 border border-[#0F4C3A]/20 flex items-center justify-between text-xs text-[#0F4C3A]">
                        <span className="font-medium">¿Deseas registrar un nuevo gasto o cotización?</span>
                        <button
                          onClick={() => {
                            setEditingBudgetItem({
                              category: 'Lugar & Banquetes',
                              description: '',
                              vendor: '',
                              estimatedCost: 0,
                              actualCost: 0,
                              paidAmount: 0,
                              isPaid: false,
                              notes: '',
                            });
                            setIsBudgetModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white font-medium text-[11px] uppercase tracking-wider cursor-pointer transition-all border border-[#B98A2E]/40"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Budget Controls & Table */}
                  <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <select
                          value={budgetCategoryFilter}
                          onChange={(e) => setBudgetCategoryFilter(e.target.value)}
                          className="px-3.5 py-2 bg-white border border-[#E5CFA3] focus:outline-none rounded-full text-xs text-[#0F4C3A] font-medium uppercase tracking-wider cursor-pointer"
                        >
                          <option value="all">Todas las Categorías</option>
                          <option value="Lugar & Banquetes">Lugar & Banquetes</option>
                          <option value="Fotografía & Video">Fotografía & Video</option>
                          <option value="Música & DJ">Música & DJ</option>
                          <option value="Vestuario & Belleza">Vestuario & Belleza</option>
                          <option value="Decoración & Flores">Decoración & Flores</option>
                          <option value="Invitaciones & Detalles">Invitaciones & Detalles</option>
                          <option value="Otros">Otros</option>
                        </select>

                        <select
                          value={budgetStatusFilter}
                          onChange={(e) => setBudgetStatusFilter(e.target.value as any)}
                          className="px-3.5 py-2 bg-white border border-[#E5CFA3] focus:outline-none rounded-full text-xs text-[#0F4C3A] font-medium uppercase tracking-wider cursor-pointer"
                        >
                          <option value="all">Todos los Estados de Pago</option>
                          <option value="paid">Liquidados / Pagados</option>
                          <option value="pending">Pendientes de Pago</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setEditingBudgetItem({
                            category: 'Lugar & Banquetes',
                            description: '',
                            vendor: '',
                            estimatedCost: 0,
                            actualCost: 0,
                            paidAmount: 0,
                            isPaid: false,
                            notes: '',
                          });
                          setIsBudgetModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white font-medium text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs border border-[#B98A2E]/40"
                      >
                        <Plus className="w-4 h-4 text-[#D9B872]" />
                        <span>Agregar Concepto</span>
                      </button>
                    </div>

                    {/* Table */}
                    <div className="rounded-[24px] bg-white border border-[#E5CFA3] overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs text-[#2A2A2A]">
                        <thead className="bg-[#F7F3EC] border-b border-[#E5CFA3] text-[10px] font-medium uppercase tracking-widest text-[#B98A2E]">
                          <tr>
                            <th className="p-3.5">Categoría</th>
                            <th className="p-3.5">Concepto / Proveedor</th>
                            <th className="p-3.5 text-right">Estimado</th>
                            <th className="p-3.5 text-right">Real / Contratado</th>
                            <th className="p-3.5 text-right">Pagado</th>
                            <th className="p-3.5 text-right">Saldo Pendiente</th>
                            <th className="p-3.5 text-center">Estado</th>
                            <th className="p-3.5 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5CFA3]/60">
                          {filteredBudgetItems.length > 0 ? (
                            filteredBudgetItems.map((item) => {
                              const pending = Math.max(0, item.actualCost - item.paidAmount);
                              return (
                                <tr key={item.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                                  <td className="p-3.5 font-medium text-[#0F4C3A]">
                                    <span className="px-2.5 py-1 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] font-semibold uppercase tracking-wider">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-sans space-y-0.5">
                                    <div className="font-serif italic text-sm text-[#0F4C3A] font-medium">{item.description}</div>
                                    {item.vendor && (
                                      <div className="text-[11px] text-[#B98A2E] font-medium">Proveedor: {item.vendor}</div>
                                    )}
                                    {item.notes && <div className="text-[10px] text-[#2A2A2A]/60 italic">{item.notes}</div>}
                                  </td>
                                  <td className="p-3.5 text-right font-mono text-xs text-[#2A2A2A]/70">
                                    ${item.estimatedCost.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-right font-mono text-xs font-semibold text-[#0F4C3A]">
                                    ${item.actualCost.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-right font-mono text-xs text-emerald-700 font-semibold">
                                    ${item.paidAmount.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-right font-mono text-xs text-amber-700 font-bold">
                                    ${pending.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 text-center font-sans">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBudgetItemPaid(item.id)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all ${
                                        item.isPaid
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                      }`}
                                      title="Haz clic para cambiar estado de pago"
                                    >
                                      {item.isPaid ? 'LIQUIDADO' : 'PENDIENTE'}
                                    </button>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <button
                                        onClick={() => {
                                          setEditingBudgetItem(item);
                                          setIsBudgetModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-full bg-white border border-[#E5CFA3] hover:bg-[#F7F3EC] text-[#0F4C3A] cursor-pointer shadow-2xs"
                                        title="Editar concepto"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBudgetItem(item.id)}
                                        className="p-1.5 rounded-full bg-white border border-[#E5CFA3] hover:bg-rose-50 text-rose-600 cursor-pointer shadow-2xs"
                                        title="Eliminar concepto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-xs text-[#2A2A2A]/50 italic">
                                No se encontraron conceptos de gasto para el filtro seleccionado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PHOTOS (GALLERY) TAB */}
              {activeTab === 'photos' && (
                <div className="space-y-6 font-sans">
                  {/* Header & Add Button */}
                  <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-2xl text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-[#B98A2E]" />
                        <span>Gestión de Fotografías de la Galería</span>
                      </h4>
                      <p className="text-xs text-[#2A2A2A]/70 font-light mt-1">
                        Agrega, edita o elimina las fotos que los invitados verán en la sección de Galería de la invitación.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenPhotoModal()}
                      className="px-4 py-2.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#D4AF37]/50 shrink-0"
                    >
                      <Plus className="w-4 h-4 text-[#D9B872]" />
                      <span>Agregar Foto</span>
                    </button>
                  </div>

                  {/* Photos Grid */}
                  {(!wedding.galleryPhotos || wedding.galleryPhotos.length === 0) ? (
                    <div className="p-12 text-center rounded-[24px] bg-white border border-[#E5CFA3] space-y-3">
                      <ImageIcon className="w-12 h-12 text-[#B98A2E]/50 mx-auto" />
                      <p className="font-serif text-lg text-[#0F4C3A] italic">No hay fotografías personalizadas aún.</p>
                      <p className="text-xs text-[#2A2A2A]/60">Haz clic en "Agregar Foto" para subir o enlazar tus imágenes preferidas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {wedding.galleryPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="p-4 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-3 flex flex-col justify-between group hover:shadow-md transition-all"
                        >
                          <div className="space-y-3">
                            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-[#E5CFA3]">
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-[#0F4C3A]/85 backdrop-blur-md text-[#F7F3EC] text-[10px] font-semibold uppercase tracking-wider border border-[#D9B872]/40">
                                {photo.category}
                              </span>
                            </div>

                            <div>
                              <p className="font-serif italic text-sm text-[#0F4C3A] font-medium line-clamp-2">
                                "{photo.caption}"
                              </p>
                              <p className="text-[10px] text-[#2A2A2A]/50 truncate font-mono mt-1">
                                {photo.url}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E5CFA3]/40 flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenPhotoModal(photo)}
                              className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-[#F7F3EC] text-[#0F4C3A] border border-[#E5CFA3] text-xs font-medium flex items-center space-x-1 cursor-pointer transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeletePhotoClick(photo.id)}
                              className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium flex items-center space-x-1 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. MESSAGES (GUESTBOOK) TAB */}
              {activeTab === 'messages' && (
                <div className="space-y-6 font-sans">
                  {/* Top Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-[20px] bg-white border border-[#E5CFA3] shadow-xs flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A]">
                        <MessageSquareCode className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B98A2E] block">Total Mensajes</span>
                        <span className="text-2xl font-serif text-[#0F4C3A] font-bold italic">{localWishes.length}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-[20px] bg-white border border-[#E5CFA3] shadow-xs flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                        <Eye className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B98A2E] block">Visibles en Web</span>
                        <span className="text-2xl font-serif text-emerald-800 font-bold italic">
                          {localWishes.filter((w) => w.isPublic !== false).length}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-[20px] bg-white border border-[#E5CFA3] shadow-xs flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-amber-50 text-amber-700">
                        <EyeOff className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B98A2E] block">Ocultos</span>
                        <span className="text-2xl font-serif text-amber-800 font-bold italic">
                          {localWishes.filter((w) => w.isPublic === false).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header & Controls */}
                  <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-[#B98A2E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={wishSearch}
                        onChange={(e) => setWishSearch(e.target.value)}
                        placeholder="Buscar por invitado o mensaje..."
                        className="w-full pl-9 pr-4 py-2 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-full text-xs font-medium text-[#0F4C3A]"
                      />
                    </div>

                    <button
                      onClick={() => setNewWishModalOpen(true)}
                      className="px-4 py-2.5 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#D4AF37]/50 shrink-0"
                    >
                      <Plus className="w-4 h-4 text-[#D9B872]" />
                      <span>Escribir Mensaje</span>
                    </button>
                  </div>

                  {/* Messages List */}
                  {localWishes.length === 0 ? (
                    <div className="p-12 text-center rounded-[24px] bg-white border border-[#E5CFA3] space-y-3">
                      <MessageSquare className="w-12 h-12 text-[#B98A2E]/50 mx-auto" />
                      <p className="font-serif text-lg text-[#0F4C3A] italic">Aún no hay mensajes en el Libro de Visitas.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localWishes
                        .filter(
                          (w) =>
                            w.guestName.toLowerCase().includes(wishSearch.toLowerCase()) ||
                            w.message.toLowerCase().includes(wishSearch.toLowerCase())
                        )
                        .map((wish) => (
                          <div
                            key={wish.id}
                            className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#0F4C3A] text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                                  {wish.guestName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-serif text-base text-[#0F4C3A] font-bold italic">{wish.guestName}</span>
                                  <span className="text-[10px] text-[#B98A2E] ml-2 font-medium">({wish.date})</span>
                                </div>

                                {wish.isPublic !== false ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider">
                                    Público
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider">
                                    Oculto
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#2A2A2A]/85 font-sans italic leading-relaxed pl-11">
                                "{wish.message}"
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => handleToggleWishVisibilityClick(wish.id, wish.isPublic !== false)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                                  wish.isPublic !== false
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title={wish.isPublic !== false ? 'Ocultar mensaje en la web' : 'Hacer público en la web'}
                              >
                                {wish.isPublic !== false ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Ocultar</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Hacer Público</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteWishClick(wish.id)}
                                className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. CATERING REPORT TAB */}
              {activeTab === 'catering' && (
                <div className="space-y-6 font-sans">
                  {/* Status Banner */}
                  <div className="p-5 rounded-[24px] bg-white border-2 border-[#0F4C3A]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] uppercase tracking-wider font-bold mb-1">
                        <Utensils className="w-3 h-3 text-[#D4AF37]" />
                        <span>Menú Cerrado & Establecido</span>
                      </div>
                      <h4 className="font-serif text-xl text-[#0F4C3A] font-medium italic">
                        Banquete Nupcial (4 Tiempos)
                      </h4>
                      <p className="text-xs text-[#2A2A2A]/70 font-light">
                        El menú ha sido contratado de forma fija para todos los comensales. La cocina preparará alternativas únicamente para los invitados con restricciones reportadas.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0F4C3A] text-white text-center sm:text-right shrink-0 border border-[#D4AF37]/40 shadow-sm">
                      <span className="text-[10px] uppercase tracking-widest text-[#E5CFA3] font-semibold block">Total de Comensales Confirmados</span>
                      <span className="text-3xl font-serif font-bold text-[#FAFAF7]">{totalAttendingCount}</span>
                      <span className="text-[11px] text-[#FAFAF7]/80 block font-light">servicios a emplatar</span>
                    </div>
                  </div>

                  {/* 4 Courses Summary */}
                  <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-3">
                    <h4 className="font-serif text-lg text-[#0F4C3A] font-medium italic">
                      Secuencia de Tiempos del Banquete
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {wedding.meals.map((m, idx) => (
                        <div key={m.id} className="p-4 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B98A2E]">
                              Paso {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] text-[9px] font-semibold">
                              {totalAttendingCount} servicios
                            </span>
                          </div>
                          <h5 className="font-serif text-base font-medium italic text-[#0F4C3A]">{m.name}</h5>
                          <p className="text-xs text-[#2A2A2A]/75 font-light leading-relaxed">{m.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Restrictions Table */}
                  <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-lg text-[#0F4C3A] font-medium italic">
                          Alergias y Restricciones Médicas ({dietaryAlerts.length})
                        </h4>
                        <p className="text-xs text-[#2A2A2A]/70 font-light">
                          Casos especiales a notificar al chef ejecutivo para preparación de platillo alternativo seguro.
                        </p>
                      </div>
                    </div>

                    {dietaryAlerts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#2A2A2A]/60 bg-[#F7F3EC] rounded-2xl border border-[#E5CFA3]">
                        No hay alergias ni restricciones registradas por los invitados confirmados hasta el momento.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#2A2A2A]">
                          <thead className="bg-[#F7F3EC] border-b border-[#E5CFA3] text-[10px] text-[#B98A2E] font-medium uppercase tracking-widest">
                            <tr>
                              <th className="p-3">Nombre Invitado</th>
                              <th className="p-3">Estatus</th>
                              <th className="p-3">Alergia o Restricción Reportada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5CFA3]/60">
                            {dietaryAlerts.map((d, i) => (
                              <tr key={i} className="hover:bg-rose-50/40">
                                <td className="p-3 text-[#0F4C3A] font-medium font-serif italic text-sm">{d.name}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full bg-[#0F4C3A]/10 text-[#0F4C3A] text-[10px] font-semibold uppercase">
                                    Confirmado
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="inline-block px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-xs">
                                    ⚠️ {d.restriction}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. DJ PLAYLIST TAB */}
              {activeTab === 'dj' && (
                <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-4 font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-xl text-[#0F4C3A] font-medium italic">Peticiones de Canciones ({songRequests.length})</h4>
                      <p className="text-xs text-[#2A2A2A]/70 font-light">Sugerencias enviadas por los invitados para el DJ</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {songRequests.map((s, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#F7F3EC] border border-[#E5CFA3] flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center space-x-3">
                          <Music className="w-4 h-4 text-[#B98A2E] shrink-0" />
                          <div>
                            <span className="font-serif text-sm font-medium italic text-[#0F4C3A] block">"{s.title}"</span>
                            <span className="text-[#2A2A2A]/70 font-light">de {s.artist || 'Artista'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#B98A2E]">Sugerida por {s.requestedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. EVENT SETTINGS TAB */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 font-sans">
                  <div className="p-5 rounded-[24px] bg-white border border-[#E5CFA3] shadow-xs space-y-4">
                    <h4 className="font-serif text-xl text-[#0F4C3A] font-medium italic">Detalles de la Boda</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Nombres de los Novios</label>
                        <input
                          type="text"
                          value={settingsForm.coupleNames}
                          onChange={(e) => setSettingsForm({ ...settingsForm, coupleNames: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Fecha y Hora</label>
                        <input
                          type="datetime-local"
                          value={settingsForm.weddingDate.slice(0, 16)}
                          onChange={(e) => setSettingsForm({ ...settingsForm, weddingDate: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Lugar de Celebración</label>
                        <input
                          type="text"
                          value={settingsForm.weddingLocation}
                          onChange={(e) => setSettingsForm({ ...settingsForm, weddingLocation: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Dirección Completa</label>
                        <input
                          type="text"
                          value={settingsForm.venueAddress}
                          onChange={(e) => setSettingsForm({ ...settingsForm, venueAddress: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[#F7F3EC]/80 border border-[#E5CFA3] rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-[#0F4C3A] font-serif italic text-sm font-semibold">
                        <ShieldCheck className="w-4 h-4 text-[#D9B872]" />
                        <span>Cuentas de Google Autorizadas para Acceso al Panel</span>
                      </div>
                      <p className="text-[11px] text-[#2A2A2A]/70 leading-relaxed">
                        Ingresa las direcciones de correo de Google del Novio y de la Novia. Solo las cuentas agregadas aquí podrán iniciar sesión en el panel de administración.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                            Correo Google ({settingsForm.partner1Name || 'Novio/a 1'})
                          </label>
                          <input
                            type="email"
                            placeholder="ejemplo1@gmail.com"
                            value={settingsForm.partner1Email || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, partner1Email: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                            Correo Google ({settingsForm.partner2Name || 'Novio/a 2'})
                          </label>
                          <input
                            type="email"
                            placeholder="ejemplo2@gmail.com"
                            value={settingsForm.partner2Email || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, partner2Email: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">PIN de Respaldo de Emergencia</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={settingsForm.adminPin || '1234'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A] font-mono tracking-widest"
                        />
                      </div>
                    </div>

                    {/* Configurable Nuestra Historia Photo Section */}
                    <div className="p-4 bg-[#F7F3EC]/80 border border-[#E5CFA3] rounded-2xl space-y-4">
                      <div className="flex items-center space-x-2 text-[#0F4C3A] font-serif italic text-sm font-semibold">
                        <ImageIcon className="w-4 h-4 text-[#D9B872]" />
                        <span>Foto de "Nuestra Historia"</span>
                      </div>
                      <p className="text-[11px] text-[#2A2A2A]/70 leading-relaxed">
                        Personaliza la foto principal que se mostrará en la sección de "Nuestra Historia" para todos los invitados.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-4 flex justify-center">
                          <div className="relative w-36 h-48 rounded-t-[70px] rounded-b-xl overflow-hidden border-2 border-[#D4AF37] shadow-md bg-white">
                            <img
                              src={settingsForm.storyImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"}
                              alt="Nuestra Historia"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 p-1 rounded-md bg-white/90 backdrop-blur-md text-center text-[9px] font-semibold text-[#0F4C3A] border border-[#E5CFA3]">
                              Vista Previa
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-8 space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">
                              URL Enlace de la Imagen
                            </label>
                            <input
                              type="url"
                              value={settingsForm.storyImageUrl || ''}
                              onChange={(e) => setSettingsForm({ ...settingsForm, storyImageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A]"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#2A2A2A]/60 block mb-1">
                              Sugerencias de Fotos:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, storyImageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80' })}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0F4C3A] hover:text-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                📸 Novios en Jardín
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, storyImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' })}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0F4C3A] hover:text-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                💍 Abrazo Romántico
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, storyImageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' })}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0F4C3A] hover:text-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                ✨ Anillos & Votos
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Texto de Nuestra Historia</label>
                      <textarea
                        value={settingsForm.ourStory}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ourStory: e.target.value })}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#E5CFA3] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-xs font-medium text-[#0F4C3A] resize-none"
                      />
                    </div>
                  </div>

                  {settingsSavedMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0F4C3A] text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                      <span>¡Detalles del evento actualizados con éxito!</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-3 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white font-medium text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm border border-[#B98A2E]/40"
                    >
                      <Save className="w-4 h-4 text-[#D9B872]" />
                      <span>{savingSettings ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                  </div>
                </form>
              )}
              </div>
            </main>
          </>
        )}

        {/* ADD / EDIT BUDGET ITEM MODAL */}
        {isBudgetModalOpen && editingBudgetItem && (
          <div className="fixed inset-0 z-50 bg-[#0B3F35]/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#F7F3EC] border border-[#E5CFA3] rounded-[32px] p-6 text-[#2A2A2A] shadow-2xl relative space-y-4 font-sans text-left">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5CFA3]">
                <h3 className="font-serif text-xl text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-[#B98A2E]" />
                  <span>{editingBudgetItem.id ? 'Editar Concepto de Gasto' : 'Nuevo Concepto de Gasto'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsBudgetModalOpen(false);
                    setEditingBudgetItem(null);
                  }}
                  className="p-1 rounded-full hover:bg-white text-[#0F4C3A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBudgetItem} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Categoría</label>
                  <select
                    value={editingBudgetItem.category || 'Lugar & Banquetes'}
                    onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Lugar & Banquetes">Lugar & Banquetes</option>
                    <option value="Fotografía & Video">Fotografía & Video</option>
                    <option value="Música & DJ">Música & DJ</option>
                    <option value="Vestuario & Belleza">Vestuario & Belleza</option>
                    <option value="Decoración & Flores">Decoración & Flores</option>
                    <option value="Invitaciones & Detalles">Invitaciones & Detalles</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Descripción / Concepto</label>
                  <input
                    type="text"
                    value={editingBudgetItem.description || ''}
                    onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, description: e.target.value })}
                    placeholder="Ej. Fotógrafo principal, Flores de mesa..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Proveedor (Opcional)</label>
                  <input
                    type="text"
                    value={editingBudgetItem.vendor || ''}
                    onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, vendor: e.target.value })}
                    placeholder="Ej. Estudio Fotográfico XYZ"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Costo Estimado ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={editingBudgetItem.estimatedCost !== undefined ? editingBudgetItem.estimatedCost : ''}
                      onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, estimatedCost: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Costo Real / Contrato ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={editingBudgetItem.actualCost !== undefined ? editingBudgetItem.actualCost : ''}
                      onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, actualCost: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Monto Pagado / Abonado ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={editingBudgetItem.paidAmount !== undefined ? editingBudgetItem.paidAmount : ''}
                      onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, paidAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-emerald-800 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Fecha Límite</label>
                    <input
                      type="date"
                      value={editingBudgetItem.dueDate || ''}
                      onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, dueDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E] mb-1">Notas de Pago / Detalles</label>
                  <input
                    type="text"
                    value={editingBudgetItem.notes || ''}
                    onChange={(e) => setEditingBudgetItem({ ...editingBudgetItem, notes: e.target.value })}
                    placeholder="Ej. Anticipo pagado por transferencia bancaria"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBudgetModalOpen(false);
                      setEditingBudgetItem(null);
                    }}
                    className="px-4 py-2 rounded-full border border-[#E5CFA3] bg-white hover:bg-[#F7F3EC] text-[#0F4C3A] text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#0F4C3A] hover:bg-[#0B3F35] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-xs border border-[#B98A2E]/40"
                  >
                    Guardar Concepto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD / EDIT GUEST MODAL */}
        {editingGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/40 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#F7F3EC] border border-[#E5CFA3] rounded-[32px] p-6 text-[#2A2A2A] shadow-2xl relative space-y-4 font-sans">
              <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic">
                {editingGuest.id ? 'Editar Invitado' : 'Agregar Nuevo Invitado'}
              </h3>

              <form onSubmit={handleSaveGuest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Nombre del Invitado</label>
                  <input
                    type="text"
                    value={editingGuest.primaryName || ''}
                    onChange={(e) => setEditingGuest({ ...editingGuest, primaryName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Categoría / Grupo</label>
                    <select
                      value={editingGuest.groupCategory || 'General'}
                      onChange={(e) => setEditingGuest({ ...editingGuest, groupCategory: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none cursor-pointer"
                    >
                      {groupOptions.map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Mesa Asignada</label>
                    <input
                      type="text"
                      value={editingGuest.tableNumber || ''}
                      onChange={(e) => setEditingGuest({ ...editingGuest, tableNumber: e.target.value })}
                      placeholder="Ej. Mesa 4, VIP 1"
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Código Invitación</label>
                    <input
                      type="text"
                      value={editingGuest.code || ''}
                      onChange={(e) => setEditingGuest({ ...editingGuest, code: e.target.value })}
                      placeholder="Ej. FAMILIA-12"
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Cupo Permitido</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={editingGuest.partySizeAllowed || 1}
                      onChange={(e) => setEditingGuest({ ...editingGuest, partySizeAllowed: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Teléfono (WhatsApp)</label>
                    <input
                      type="text"
                      value={editingGuest.phone || ''}
                      onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                      placeholder="+52 55..."
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">Estado RSVP</label>
                    <select
                      value={editingGuest.status || 'pending'}
                      onChange={(e) => setEditingGuest({ ...editingGuest, status: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium uppercase tracking-wider focus:outline-none"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="attending">Confirmado</option>
                      <option value="declined">Declinado</option>
                    </select>
                  </div>
                </div>

                {editingGuest.partySizeAllowed && editingGuest.partySizeAllowed > 1 && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#B98A2E]">
                      Nombre del Acompañante (Pase para 2)
                    </label>
                    <input
                      type="text"
                      value={editingGuest.plusOne?.fullName || ''}
                      onChange={(e) =>
                        setEditingGuest({
                          ...editingGuest,
                          plusOne: {
                            attending: true,
                            fullName: e.target.value,
                            dietaryRestrictions: editingGuest.plusOne?.dietaryRestrictions || '',
                          },
                        })
                      }
                      placeholder="Nombre del acompañante (los novios pueden pre-asignarlo aquí)"
                      className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#E5CFA3] rounded-xl text-xs text-[#0F4C3A] font-medium focus:outline-none"
                    />
                  </div>
                )}

                {editingGuest.code && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E5CFA3] space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] block">
                      Link Personal de Invitación (Guarda en Firebase)
                    </span>
                    <p className="font-mono text-[11px] text-[#0F4C3A] break-all bg-[#F7F3EC] p-2 rounded-xl border border-[#E5CFA3]">
                      {getGuestInviteUrl(editingGuest.code)}
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <a
                        href={getWhatsappInviteUrl(editingGuest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-medium uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 fill-current" />
                        <span>Enviar WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(editingGuest)}
                        className="px-3.5 py-2 rounded-full bg-white border border-[#E5CFA3] hover:bg-[#F7F3EC] text-[#0F4C3A] text-[11px] font-medium uppercase tracking-wider flex items-center space-x-1 cursor-pointer shadow-2xs"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#B98A2E]" />
                        <span>{copiedGuestId === (editingGuest.id || 'new') ? '¡Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingGuest(null)}
                    className="px-4 py-2 text-[#2A2A2A]/70 font-medium uppercase tracking-wider hover:text-[#0F4C3A] cursor-pointer text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0F4C3A] text-white font-medium rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-sm hover:bg-[#0B3F35] border border-[#B98A2E]/40"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD / EDIT PHOTO MODAL */}
        {photoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/40 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg bg-[#F7F3EC] border border-[#E5CFA3] rounded-[32px] p-6 text-[#2A2A2A] shadow-2xl relative space-y-4 font-sans">
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-[#2A2A2A]/50 hover:text-[#0F4C3A] cursor-pointer rounded-full hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                <Camera className="w-5 h-5 text-[#B98A2E]" />
                <span>{editingPhoto ? 'Editar Fotografía' : 'Agregar Nueva Fotografía'}</span>
              </h3>

              <form onSubmit={handleSavePhotoSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                    URL de la Imagen
                  </label>
                  <input
                    type="url"
                    value={photoForm.url}
                    onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                    required
                  />
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-[#2A2A2A]/60 block font-medium">Fotos de muestra (haz clic para probar):</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' })}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white transition-all cursor-pointer"
                      >
                        Compromiso
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' })}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white transition-all cursor-pointer"
                      >
                        Anillos
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80' })}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white transition-all cursor-pointer"
                      >
                        Jardines
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' })}
                        className="px-2.5 py-1 rounded-full bg-white border border-[#E5CFA3] text-[10px] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white transition-all cursor-pointer"
                      >
                        Brindis
                      </button>
                    </div>
                  </div>
                </div>

                {photoForm.url && (
                  <div className="p-2 rounded-2xl bg-white border border-[#E5CFA3] flex items-center justify-center max-h-36 overflow-hidden">
                    <img src={photoForm.url} alt="Vista previa" className="h-32 object-cover rounded-xl" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                      Categoría
                    </label>
                    <select
                      value={photoForm.category}
                      onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                    >
                      <option value="novios">Los Novios</option>
                      <option value="detalles">Detalles</option>
                      <option value="lugar">El Lugar</option>
                      <option value="momentos">Momentos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                      Pie de Foto / Leyenda
                    </label>
                    <input
                      type="text"
                      value={photoForm.caption}
                      onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                      placeholder="Ej. Sesión de novios en Angeli Gardens"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                      required
                    />
                  </div>
                </div>

                {photoMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0F4C3A] text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{photoMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(false)}
                    className="px-4 py-2 text-[#2A2A2A]/70 font-medium uppercase tracking-wider hover:text-[#0F4C3A] cursor-pointer text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={photoSaving}
                    className="px-6 py-2.5 bg-[#0F4C3A] text-white font-medium rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-sm hover:bg-[#0B3F35] border border-[#B98A2E]/40"
                  >
                    {photoSaving ? 'Guardando...' : 'Guardar Foto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD WISH / MESSAGE MODAL */}
        {newWishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3F35]/40 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-[#F7F3EC] border border-[#E5CFA3] rounded-[32px] p-6 text-[#2A2A2A] shadow-2xl relative space-y-4 font-sans">
              <button
                onClick={() => setNewWishModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-[#2A2A2A]/50 hover:text-[#0F4C3A] cursor-pointer rounded-full hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-2xl text-[#0F4C3A] font-medium italic flex items-center space-x-2">
                <MessageSquareCode className="w-5 h-5 text-[#B98A2E]" />
                <span>Escribir Mensaje en el Muro</span>
              </h3>

              <form onSubmit={handleAddWishSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                    Nombre del Emisor (Invitado, Novios o Familiar)
                  </label>
                  <input
                    type="text"
                    value={newWishForm.guestName}
                    onChange={(e) => setNewWishForm({ ...newWishForm, guestName: e.target.value })}
                    placeholder="Ej. Tía Sofía o Novios"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C3A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B98A2E] mb-1">
                    Mensaje / Buenos Deseos
                  </label>
                  <textarea
                    value={newWishForm.message}
                    onChange={(e) => setNewWishForm({ ...newWishForm, message: e.target.value })}
                    rows={4}
                    placeholder="Escribe aquí los buenos deseos que se mostrarán en la web..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5CFA3] rounded-xl text-[#0F4C3A] font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] resize-none"
                    required
                  />
                </div>

                {wishMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0F4C3A] text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{wishMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setNewWishModalOpen(false)}
                    className="px-4 py-2 text-[#2A2A2A]/70 font-medium uppercase tracking-wider hover:text-[#0F4C3A] cursor-pointer text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={wishSaving}
                    className="px-6 py-2.5 bg-[#0F4C3A] text-white font-medium rounded-full text-xs uppercase tracking-wider cursor-pointer shadow-sm hover:bg-[#0B3F35] border border-[#B98A2E]/40"
                  >
                    {wishSaving ? 'Publicando...' : 'Publicar Mensaje'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Modal */}
        <GuestQrModal
          guest={selectedQrGuest}
          coupleNames={wedding.coupleNames}
          isOpen={!!selectedQrGuest}
          onClose={() => setSelectedQrGuest(null)}
        />
      </div>
    </div>
  );
};
