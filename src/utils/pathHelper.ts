import { ShortcutType } from '../types';

/**
 * Detect the type of URL or path provided by the user.
 */
export function detectShortcutType(input: string): ShortcutType {
  const trimmed = input.trim();
  
  // Windows drive pattern (e.g. D:\..., C:/..., D:/)
  if (/^[a-zA-Z]:[\\/]/i.test(trimmed) || /^[a-zA-Z]:$/i.test(trimmed)) {
    return 'directory';
  }

  // File protocol
  if (trimmed.startsWith('file://')) {
    return 'directory';
  }

  // Unix directory pattern (e.g. /home/..., /var/..., ~/...)
  if (trimmed.startsWith('/') || trimmed.startsWith('~/')) {
    return 'directory';
  }

  // Common desktop app protocols
  if (/^[a-z0-9_-]+:\/\//i.test(trimmed) && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'protocol';
  }

  // Web link
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'web';
  }

  // Defaults: if contains dots and no backslashes, treat as web
  if (trimmed.includes('.') && !trimmed.includes('\\') && !trimmed.includes(' ')) {
    return 'web';
  }

  return 'web';
}

/**
 * Normalize and clean a link or directory path.
 */
export function normalizePath(input: string, type: ShortcutType): string {
  const trimmed = input.trim();
  if (type === 'web') {
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
  }
  return trimmed;
}

/**
 * Extract clean display host or drive path for UI preview.
 */
export function getDisplayUrl(url: string, type: ShortcutType): string {
  if (type === 'directory') {
    return url;
  }
  if (type === 'web') {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname.slice(0, 20) : '');
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * Get Google Favicon service URL for web links.
 */
export function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return '';
  }
}

/**
 * Generate Windows Explorer command string.
 */
export function getWindowsExplorerCommand(path: string): string {
  const cleanPath = path.replace(/^file:\/\/\/?/i, '').replace(/\//g, '\\');
  return `explorer "${cleanPath}"`;
}

/**
 * Generate Windows Run prompt advice.
 */
export function getWindowsRunCommand(path: string): string {
  return path.replace(/^file:\/\/\/?/i, '').replace(/\//g, '\\');
}

/**
 * Safely copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Execute opening or copying of a shortcut based on its type.
 */
export async function launchShortcut(url: string, type: ShortcutType): Promise<{
  actionTaken: 'opened_tab' | 'copied_directory' | 'launched_protocol';
  message: string;
}> {
  if (type === 'web') {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return {
      actionTaken: 'opened_tab',
      message: 'Membuka layanan di tab baru.',
    };
  }

  if (type === 'protocol') {
    window.location.href = url;
    return {
      actionTaken: 'launched_protocol',
      message: 'Memicu aplikasi desktop terkait...',
    };
  }

  // For local directories (e.g. D:\Proyek, C:\Users, etc.)
  // Browsers enforce a security sandbox preventing web apps from opening file:// links directly without extension.
  // We copy the path to clipboard and attempt window.open(fileUrl)
  let fileUrl = url;
  if (/^[a-zA-Z]:[\\/]/i.test(url)) {
    fileUrl = `file:///${url.replace(/\\/g, '/')}`;
  }

  // Attempt opening file link (some enterprise browsers / Electron / custom configured browsers allow this)
  try {
    window.open(fileUrl, '_blank');
  } catch {
    // Ignore sandbox restriction
  }

  // Copy local path to clipboard for instant Windows Explorer pasting
  await copyToClipboard(url);

  return {
    actionTaken: 'copied_directory',
    message: `Alamat direktori disalin ke clipboard! (${url}). Buka File Explorer atau tekan Win+R lalu paste.`,
  };
}
