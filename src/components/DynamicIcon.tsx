import React, { useState, useEffect } from 'react';
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Boxes,
  Briefcase,
  Bug,
  Calculator,
  Calendar,
  Camera,
  CheckSquare,
  ClipboardList,
  Clock,
  Cloud,
  Code,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  FolderArchive,
  FolderDown,
  FolderGit2,
  FolderKanban,
  FolderOpen,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  HardDrive,
  Headphones,
  Heart,
  Image,
  Key,
  Laptop,
  Layers,
  Lock,
  LucideProps,
  Mail,
  MessageSquare,
  Mic,
  Monitor,
  Music,
  Palette,
  PenTool,
  Phone,
  PieChart,
  Play,
  Presentation,
  Printer,
  Receipt,
  Search,
  Send,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Terminal,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  Wallet,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Boxes,
  Briefcase,
  Bug,
  Calculator,
  Calendar,
  Camera,
  CheckSquare,
  ClipboardList,
  Clock,
  Cloud,
  Code,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  FolderArchive,
  FolderDown,
  FolderGit2,
  FolderKanban,
  FolderOpen,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  HardDrive,
  Headphones,
  Heart,
  Image,
  Key,
  Laptop,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  Monitor,
  Music,
  Palette,
  PenTool,
  Phone,
  PieChart,
  Play,
  Presentation,
  Printer,
  Receipt,
  Search,
  Send,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Terminal,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  Wallet,
  Workflow,
  Wrench,
  Zap,
};

export function isImageIcon(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith('data:image/') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/')
  );
}

interface DynamicIconProps extends LucideProps {
  name?: string;
  fallback?: React.ComponentType<LucideProps>;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  fallback: Fallback = Globe,
  className,
  ...props
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [name]);

  if (!name) {
    return <Fallback className={className} {...props} />;
  }

  if (isImageIcon(name) && !imgError) {
    return (
      <img
        src={name}
        alt=""
        onError={() => setImgError(true)}
        className={`${className || 'w-4 h-4'} object-cover rounded-sm shrink-0`}
      />
    );
  }

  const Component = ICON_MAP[name];
  if (Component) {
    return <Component className={className} {...props} />;
  }

  return <Fallback className={className} {...props} />;
};

export const AVAILABLE_GROUP_ICONS = [
  { name: 'Briefcase', label: 'Pekerjaan' },
  { name: 'HardDrive', label: 'Drive & Folder' },
  { name: 'User', label: 'Pribadi' },
  { name: 'Terminal', label: 'Developer' },
  { name: 'Code', label: 'Kode & IDE' },
  { name: 'FolderKanban', label: 'Manajemen Proyek' },
  { name: 'CreditCard', label: 'Keuangan & Bank' },
  { name: 'GraduationCap', label: 'Pendidikan / Riset' },
  { name: 'Palette', label: 'Desain & Kreatif' },
  { name: 'MessageSquare', label: 'Komunikasi' },
  { name: 'Database', label: 'Database & SQL' },
  { name: 'Bookmark', label: 'Favorit' },
  { name: 'Shield', label: 'Keamanan' },
  { name: 'Sparkles', label: 'AI & Eksperimen' },
  { name: 'Layers', label: 'Infrastruktur' },
  { name: 'Zap', label: 'Alat Cepat' },
];

export interface ShortcutIconDefinition {
  name: string;
  label: string;
  category: 'storage' | 'dev' | 'office' | 'communication' | 'media' | 'finance' | 'tools';
}

export const ICON_CATEGORIES = [
  { id: 'all', label: 'Semua Ikon' },
  { id: 'storage', label: 'Drive & Berkas' },
  { id: 'dev', label: 'Developer & IT' },
  { id: 'office', label: 'Kantor & Dokumen' },
  { id: 'communication', label: 'Komunikasi & Rapat' },
  { id: 'media', label: 'Desain & Media' },
  { id: 'finance', label: 'Keuangan & Bisnis' },
  { id: 'tools', label: 'Utilitas & Web' },
];

export const AVAILABLE_SHORTCUT_ICONS: ShortcutIconDefinition[] = [
  // 1. Penyimpanan, Drive & Folder
  { name: 'HardDrive', label: 'Drive D: / C:', category: 'storage' },
  { name: 'Folder', label: 'Folder Direktori', category: 'storage' },
  { name: 'FolderOpen', label: 'Folder Terbuka', category: 'storage' },
  { name: 'FolderArchive', label: 'Folder Aset / Arsip', category: 'storage' },
  { name: 'FolderGit2', label: 'Folder Repositori Git', category: 'storage' },
  { name: 'FolderDown', label: 'Folder Unduhan', category: 'storage' },
  { name: 'Database', label: 'Database / SQL / Dump', category: 'storage' },
  { name: 'Server', label: 'Server & Host Lokal', category: 'storage' },
  { name: 'Cloud', label: 'Cloud Storage (Drive/Dropbox)', category: 'storage' },
  { name: 'Download', label: 'File Unduhan', category: 'storage' },
  { name: 'Upload', label: 'File Unggahan', category: 'storage' },
  { name: 'Archive', label: 'Arsip ZIP / RAR', category: 'storage' },

  // 2. Developer, Komputer & Sistem
  { name: 'Code', label: 'VS Code / Editor IDE', category: 'dev' },
  { name: 'Terminal', label: 'Terminal / CMD / PowerShell', category: 'dev' },
  { name: 'Cpu', label: 'Hardware & Prosesor', category: 'dev' },
  { name: 'Layers', label: 'Tech Stack / Framework', category: 'dev' },
  { name: 'GitBranch', label: 'Git Branch / Version Control', category: 'dev' },
  { name: 'FileCode', label: 'Source Code File', category: 'dev' },
  { name: 'Laptop', label: 'Laptop / PC Workstation', category: 'dev' },
  { name: 'Monitor', label: 'Display / Layar Monitor', category: 'dev' },
  { name: 'Smartphone', label: 'Mobile App / Android / iOS', category: 'dev' },
  { name: 'Boxes', label: 'Package Manager / NPM', category: 'dev' },
  { name: 'Key', label: 'API Key & Token', category: 'dev' },
  { name: 'ShieldCheck', label: 'Keamanan & Autentikasi', category: 'dev' },
  { name: 'Bug', label: 'Bug Tracker / Testing', category: 'dev' },
  { name: 'Workflow', label: 'CI/CD Pipeline', category: 'dev' },

  // 3. Kantor, Dokumen & Produktivitas
  { name: 'FileText', label: 'Dokumen Word / Catatan', category: 'office' },
  { name: 'FileSpreadsheet', label: 'Excel / Spreadsheet', category: 'office' },
  { name: 'Briefcase', label: 'Pekerjaan & Kantor', category: 'office' },
  { name: 'Calendar', label: 'Kalender & Jadwal Rapat', category: 'office' },
  { name: 'Clock', label: 'Jam & Waktu Kerja', category: 'office' },
  { name: 'CheckSquare', label: 'Daftar Tugas / To-Do', category: 'office' },
  { name: 'Bookmark', label: 'Penanda / Favorit', category: 'office' },
  { name: 'BookOpen', label: 'Buku / Dokumentasi SOP', category: 'office' },
  { name: 'Presentation', label: 'Slide Presentasi (PPT)', category: 'office' },
  { name: 'Calculator', label: 'Kalkulator / Akuntansi', category: 'office' },
  { name: 'ClipboardList', label: 'Formulir & Checklist', category: 'office' },

  // 4. Komunikasi, Rapat & Sosial
  { name: 'Mail', label: 'Email / Gmail / Outlook', category: 'communication' },
  { name: 'MessageSquare', label: 'Pesan / WhatsApp / Slack', category: 'communication' },
  { name: 'Send', label: 'Telegram / Pengiriman Pesan', category: 'communication' },
  { name: 'Video', label: 'Zoom / Google Meet', category: 'communication' },
  { name: 'Phone', label: 'Panggilan Telepon', category: 'communication' },
  { name: 'Users', label: 'Tim Kerja / Komunitas', category: 'communication' },
  { name: 'Share2', label: 'Jejaring Sosial / Berbagi', category: 'communication' },
  { name: 'Bell', label: 'Notifikasi & Pengingat', category: 'communication' },
  { name: 'Headphones', label: 'Customer Support / Helpdesk', category: 'communication' },

  // 5. Desain, Kreatif & Media
  { name: 'Palette', label: 'Figma / Desain Grafis', category: 'media' },
  { name: 'Image', label: 'Galeri Gambar / Foto', category: 'media' },
  { name: 'Film', label: 'Video / Editing Film', category: 'media' },
  { name: 'Camera', label: 'Kamera / Cuplikan Layar', category: 'media' },
  { name: 'Music', label: 'Spotify / Musik & Audio', category: 'media' },
  { name: 'Sparkles', label: 'AI Generatif & Kreatif', category: 'media' },
  { name: 'PenTool', label: 'Vektor / Ilustrasi Canva', category: 'media' },
  { name: 'Play', label: 'YouTube / Pemutar Video', category: 'media' },
  { name: 'Compass', label: 'Eksplorasi & Navigasi', category: 'media' },
  { name: 'Mic', label: 'Podcast & Rekaman Suara', category: 'media' },

  // 6. Finansial & Bisnis
  { name: 'CreditCard', label: 'Kartu ATM / Internet Banking', category: 'finance' },
  { name: 'Wallet', label: 'Dompet Digital / E-Wallet', category: 'finance' },
  { name: 'DollarSign', label: 'Mata Uang & Kas', category: 'finance' },
  { name: 'TrendingUp', label: 'Saham / Kripto / Investasi', category: 'finance' },
  { name: 'Receipt', label: 'Faktur & Invoice Tagihan', category: 'finance' },
  { name: 'ShoppingBag', label: 'E-Commerce / Belanja Online', category: 'finance' },
  { name: 'Store', label: 'Toko / Marketplace', category: 'finance' },
  { name: 'BarChart3', label: 'Grafik Analitik & KPI', category: 'finance' },
  { name: 'PieChart', label: 'Laporan Finansial', category: 'finance' },

  // 7. Utilitas & Alat Web
  { name: 'Globe', label: 'Portal Web / Situs', category: 'tools' },
  { name: 'Search', label: 'Mesin Pencari / Google', category: 'tools' },
  { name: 'Wrench', label: 'Alat / Pemeliharaan', category: 'tools' },
  { name: 'Hammer', label: 'Perbaikan Sistem', category: 'tools' },
  { name: 'Zap', label: 'Akses Kilat / Shortcut', category: 'tools' },
  { name: 'ExternalLink', label: 'Tautan Eksternal', category: 'tools' },
  { name: 'Lock', label: 'Akses Terproteksi', category: 'tools' },
  { name: 'Star', label: 'Bintang Utama', category: 'tools' },
  { name: 'Heart', label: 'Layanan Favorit', category: 'tools' },
  { name: 'Printer', label: 'Cetak Dokumen', category: 'tools' },
];
