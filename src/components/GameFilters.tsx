'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Platform } from '@/types/game';
import { SlidersHorizontal, Sparkles, PackageCheck, ArrowUpDown } from 'lucide-react';

export const GameFilters: React.FC = () => {
  const {
    games,
    selectedPlatform,
    setSelectedPlatform,
    sortBy,
    setSortBy,
    maxPriceFilter,
    setMaxPriceFilter,
    onlyInStock,
    setOnlyInStock,
    onlyPriceDrops,
    setOnlyPriceDrops,
  } = useApp();

  const platforms: { id: 'ALL' | Platform; label: string; iconBg: string; activeBg: string }[] = [
    { id: 'ALL', label: 'Tüm Platformlar', iconBg: 'bg-zinc-700', activeBg: 'bg-red-600 text-white border-red-500 shadow-red-600/30' },
    { id: 'PS5', label: 'PlayStation 5', iconBg: 'bg-blue-600', activeBg: 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30' },
    { id: 'PS4', label: 'PlayStation 4', iconBg: 'bg-indigo-600', activeBg: 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30' },
    { id: 'XBOX_SX', label: 'Xbox Series X/S', iconBg: 'bg-emerald-600', activeBg: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30' },
    { id: 'XBOX_ONE', label: 'Xbox One', iconBg: 'bg-green-600', activeBg: 'bg-green-600 text-white border-green-500 shadow-green-600/30' },
    { id: 'XBOX_360', label: 'Xbox 360', iconBg: 'bg-lime-600', activeBg: 'bg-lime-600 text-white border-lime-500 shadow-lime-600/30' },
  ];

  // Count items per platform
  const getCount = (platform: 'ALL' | Platform) => {
    if (platform === 'ALL') return games.length;
    return games.filter((g) => g.platform === platform).length;
  };

  return (
    <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 mb-6 shadow-md text-white">
      {/* Platform Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {platforms.map((p) => {
          const count = getCount(p.id);
          const isSelected = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? `${p.activeBg} shadow-md scale-[1.02]`
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{p.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Sorting, Price Slider, Toggles */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Left Side: Sort Dropdown & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating')}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="discount" className="bg-zinc-900 text-white">🔥 En Çok İndirimdeki</option>
              <option value="price_asc" className="bg-zinc-900 text-white">💰 Fiyat: En Düşük</option>
              <option value="price_desc" className="bg-zinc-900 text-white">💎 Fiyat: En Yüksek</option>
              <option value="rating" className="bg-zinc-900 text-white">⭐ En Yüksek Puan</option>
              <option value="title" className="bg-zinc-900 text-white">🔤 İsim (A-Z)</option>
            </select>
          </div>

          {/* Price Drops Only Toggle */}
          <button
            onClick={() => setOnlyPriceDrops(!onlyPriceDrops)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
              onlyPriceDrops
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${onlyPriceDrops ? 'text-amber-400' : 'text-zinc-500'}`} />
            <span>Fiyatı Düşenler</span>
          </button>

          {/* In Stock Only Toggle */}
          <button
            onClick={() => setOnlyInStock(!onlyInStock)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
              onlyInStock
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PackageCheck className={`w-3.5 h-3.5 ${onlyInStock ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>Stokta Olanlar</span>
          </button>
        </div>

        {/* Right Side: Max Price Slider */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 whitespace-nowrap">Maks Fiyat:</span>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
            className="w-24 sm:w-32 accent-red-600 cursor-pointer"
          />
          <span className="font-mono font-bold text-white whitespace-nowrap">
            £{maxPriceFilter}
          </span>
          {maxPriceFilter < 80 && (
            <button
              onClick={() => setMaxPriceFilter(100)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Sıfırla
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
