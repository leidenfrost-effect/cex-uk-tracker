import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PriorityLevel } from '@/types/game';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTry(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDiscount(currentPrice: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function getPlatformBadgeColor(platform: string): { bg: string; text: string; border: string } {
  switch (platform) {
    case 'PS5':
      return { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-700/50' };
    case 'PS4':
      return { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-700/50' };
    case 'XBOX_SX':
      return { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/50' };
    case 'XBOX_ONE':
      return { bg: 'bg-green-950/80', text: 'text-green-300', border: 'border-green-700/50' };
    case 'XBOX_360':
      return { bg: 'bg-lime-950/80', text: 'text-lime-300', border: 'border-lime-700/50' };
    default:
      return { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };
  }
}

export function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'PS5':
      return 'PlayStation 5';
    case 'PS4':
      return 'PlayStation 4';
    case 'XBOX_SX':
      return 'Xbox Series X/S';
    case 'XBOX_ONE':
      return 'Xbox One';
    case 'XBOX_360':
      return 'Xbox 360';
    default:
      return platform;
  }
}

export function getPriorityMeta(priority: PriorityLevel): { label: string; color: string; badge: string } {
  switch (priority) {
    case 'must_buy':
      return { label: 'Kesin Alınacak 🔥', color: 'text-orange-400', badge: 'bg-orange-950/80 text-orange-300 border-orange-800' };
    case 'high':
      return { label: 'Yüksek Öncelik ⭐', color: 'text-amber-400', badge: 'bg-amber-950/80 text-amber-300 border-amber-800' };
    case 'nice_to_have':
      return { label: 'Fiyatı Uygunsa 👍', color: 'text-sky-400', badge: 'bg-sky-950/80 text-sky-300 border-sky-800' };
    case 'backup':
      return { label: 'Alternatif / Yedek 🎯', color: 'text-purple-400', badge: 'bg-purple-950/80 text-purple-300 border-purple-800' };
  }
}
