import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm border border-amber-300/40"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Menggunakan data cache lokal &amp; Firestore</span>
    </div>
  );
};
