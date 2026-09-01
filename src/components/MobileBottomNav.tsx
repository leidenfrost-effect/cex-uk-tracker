'use client';

import React from 'react';
import {
  Gamepad2,
  PlusCircle,
  Settings,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MobileBottomNavProps {
  activeView: 'catalog' | 'trends';
  setActiveView: (view: 'catalog' | 'trends') => void;
  basketCount: number;
  onOpenBasket: () => void;
  onOpenAddGame: () => void;
  onOpenBudgetSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  basketCount,
  onOpenBasket,
  onOpenAddGame,
  onOpenBudgetSettings,
}) => {
  const itemClass = (isActive = false) =>
    `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${
      isActive ? 'bg-blue-600/15 text-blue-300' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <nav
      aria-label="Mobil uygulama navigasyonu"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-900/95 px-2 pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:hidden pb-safe"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-1">
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className={itemClass(activeView === 'catalog')}
          aria-label="Kataloğu aç"
          aria-current={activeView === 'catalog' ? 'page' : undefined}
        >
          <Gamepad2 className="h-5 w-5" />
          <span>Katalog</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('trends')}
          className={itemClass(activeView === 'trends')}
          aria-label="Fiyat takibini aç"
          aria-current={activeView === 'trends' ? 'page' : undefined}
        >
          <TrendingDown className="h-5 w-5 text-amber-300" />
          <span>Takip</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddGame}
          className={itemClass()}
          aria-label="Kataloğa oyun ekle"
        >
          <PlusCircle className="h-5 w-5 text-emerald-400" />
          <span>Oyun Ekle</span>
        </button>

        <button
          type="button"
          onClick={onOpenBudgetSettings}
          className={itemClass()}
          aria-label="Bütçe ve kur ayarlarını aç"
        >
          <Settings className="h-5 w-5" />
          <span>Bütçe</span>
        </button>

        <ThemeToggle />

        <button
          type="button"
          onClick={onOpenBasket}
          className={itemClass()}
          aria-label={`Seyahat sepetini aç${basketCount ? `, ${basketCount} oyun` : ''}`}
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {basketCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white">
                {basketCount}
              </span>
            )}
          </span>
          <span>Sepet</span>
        </button>
      </div>
    </nav>
  );
};
