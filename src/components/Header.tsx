'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatGbp, formatTry } from '@/lib/utils';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { 
  ShoppingBag, 
  TrendingDown, 
  Settings, 
  MapPin, 
  Search, 
  PlusCircle, 
  Gamepad2, 
  PoundSterling,
  Plane,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  onOpenBasket: () => void;
  onOpenAddGame: () => void;
  onOpenBudgetSettings: () => void;
  onOpenStoreGuide: () => void;
  onOpenDataRefresh: () => void;
  activeView: 'catalog' | 'trends';
  setActiveView: (view: 'catalog' | 'trends') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBasket,
  onOpenAddGame,
  onOpenBudgetSettings,
  onOpenStoreGuide,
  onOpenDataRefresh,
  activeView,
  setActiveView,
}) => {
  const {
    basketCount,
    totalBasketGbp,
    totalBasketTry,
    budgetLimitGbp,
    exchangeRate,
    isCustomRate,
    searchQuery,
    setSearchQuery,
    isLoadingRate,
    exchangeRateMeta,
  } = useApp();

  const budgetPercent = Math.min(100, Math.round((totalBasketGbp / (budgetLimitGbp || 1)) * 100));
  const isOverBudget = totalBasketGbp > budgetLimitGbp;

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-zinc-800 text-white shadow-lg">
      {/* Top Travel Banner */}
      <div className="bg-gradient-to-r from-red-900/60 via-zinc-900 to-red-950/60 border-b border-red-900/30 px-4 py-1 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-red-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase">
              <Plane className="w-3 h-3 inline animate-pulse" /> UK Travel 2026
            </span>
            <span className="hidden sm:inline text-zinc-300">
              CeX UK Oyun Fiyat Takip & Seyahat Alışveriş Listesi
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={onOpenBudgetSettings}
              className="flex items-center gap-1 hover:text-white transition-colors bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500"
              title="Kuru veya Bütçeyi Güncelle"
            >
              <PoundSterling className="w-3.5 h-3.5 text-amber-400" />
              <span>{isLoadingRate ? 'Kur yükleniyor' : <>1 £ = <strong>{exchangeRate.toFixed(2)} ₺</strong></>}</span>
              {isCustomRate && <span className="text-[10px] text-amber-400">(Özel)</span>}
              {!isCustomRate && exchangeRateMeta?.isStale && <span className="text-[10px] text-rose-400">(Eski)</span>}
            </button>

            <button
              onClick={onOpenStoreGuide}
              className="hidden md:flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>CeX Londra & UK Mağazaları</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 cursor-pointer items-center gap-2" onClick={() => setActiveView('catalog')}>
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-2xl tracking-tighter text-white shadow-lg shadow-red-600/30 border border-red-500">
                CeX
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-extrabold text-base text-white tracking-tight sm:text-lg">GameTracker</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-red-400 border border-red-900/40">UK</span>
                </div>
                <p className="text-[11px] text-zinc-400">PS4 • PS5 • XBOX 360/One/Series X</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Oyun adı ara (örn. Bloodborne, Spider-Man, Halo)..."
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <button
              onClick={onOpenDataRefresh}
              className="p-2 sm:px-3 sm:py-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-200 flex items-center gap-1.5"
              title="CeX ve TCMB verilerini yenile"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span className="hidden xl:inline">Verileri Yenile</span>
            </button>
            
            {/* View Switcher: Catalog vs Daily Trends */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveView('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'catalog'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Katalog</span>
              </button>
              <button
                onClick={() => setActiveView('trends')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'trends'
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">Fiyat Takibi</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </button>
            </div>

            {/* Add Custom Game Button */}
            <button
              onClick={onOpenAddGame}
              className="p-2 sm:px-3 sm:py-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all"
              title="Yeni Oyun Ekle"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Oyun Ekle</span>
            </button>

            {/* Budget & Rate Settings */}
            <button
              onClick={onOpenBudgetSettings}
              className="p-2 sm:p-2.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all"
              title="Bütçe ve Kur Ayarları"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Travel Basket Drawer Trigger Button */}
            <button
              onClick={onOpenBasket}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all border shadow-md ${
                isOverBudget
                  ? 'bg-rose-950 border-rose-600 text-rose-200'
                  : 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-red-600/30'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {basketCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {basketCount}
                  </span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] leading-tight">Seyahat Sepetim</div>
                <div className="text-[10px] opacity-90 font-mono">
                  {formatGbp(totalBasketGbp)} <span className="text-[9px]">({formatTry(totalBasketTry)})</span>
                </div>
              </div>
            </button>

          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            <button
              onClick={onOpenDataRefresh}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/90 text-zinc-200"
              title="CeX ve TCMB verilerini yenile"
              aria-label="Verileri yenile"
            >
              <RefreshCw className="h-4 w-4 text-sky-400" />
            </button>
            <button
              onClick={onOpenStoreGuide}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/90 text-zinc-200"
              title="CeX Londra ve UK mağazaları"
              aria-label="Mağaza rehberini aç"
            >
              <MapPin className="h-4 w-4 text-red-400" />
            </button>
            <button
              onClick={onOpenBasket}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border ${
                isOverBudget
                  ? 'border-rose-600 bg-rose-950 text-rose-200'
                  : 'border-red-500 bg-red-600 text-white'
              }`}
              title="Seyahat sepetim"
              aria-label={`Seyahat sepetini aç${basketCount ? `, ${basketCount} oyun` : ''}`}
            >
              <ShoppingBag className="h-4 w-4" />
              {basketCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-red-600">
                  {basketCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 sm:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyun adı veya platform ara..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Mini Budget Bar in Header */}
        <div className="mt-2 flex flex-col items-stretch justify-between gap-2 border-t border-zinc-800/80 pt-2 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-zinc-300 sm:text-[11px]">
              Seyahat Bütçesi: <strong className="text-white font-mono">{formatGbp(totalBasketGbp)}</strong> / {formatGbp(budgetLimitGbp)}
            </span>
            <div className="h-1.5 min-w-0 flex-1 max-w-xs overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isOverBudget ? 'bg-rose-500' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <span className={`text-[10px] font-mono font-semibold ${isOverBudget ? 'text-rose-400' : 'text-zinc-400'}`}>
              %{budgetPercent}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-400">
            <span>Sepetteki Ürün: <strong className="text-zinc-200">{basketCount} adet</strong></span>
            <span>Kalan Bütçe: <strong className="text-emerald-400 font-mono">{formatGbp(Math.max(0, budgetLimitGbp - totalBasketGbp))}</strong></span>
          </div>
        </div>

      </div>

      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        basketCount={basketCount}
        onOpenBasket={onOpenBasket}
        onOpenAddGame={onOpenAddGame}
        onOpenBudgetSettings={onOpenBudgetSettings}
      />
    </header>
  );
};
