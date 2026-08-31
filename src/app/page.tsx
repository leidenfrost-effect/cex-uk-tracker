'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { GameItem } from '@/types/game';
import { Header } from '@/components/Header';
import { GameFilters } from '@/components/GameFilters';
import { GameCard } from '@/components/GameCard';
import { BasketModal } from '@/components/BasketModal';
import { PriceHistoryModal } from '@/components/PriceHistoryModal';
import { DailyTrendsView } from '@/components/DailyTrendsView';
import { BudgetSettingsModal } from '@/components/BudgetSettingsModal';
import { AddGameModal } from '@/components/AddGameModal';
import { StoreGuideModal } from '@/components/StoreGuideModal';
import { DataRefreshModal } from '@/components/DataRefreshModal';
import { calculateDiscount, formatGbp, formatTry } from '@/lib/utils';
import { Gamepad2, ShoppingBag, Search, Sparkles, FilterX, HelpCircle } from 'lucide-react';

export default function Home() {
  const {
    games,
    selectedPlatform,
    searchQuery,
    sortBy,
    maxPriceFilter,
    onlyInStock,
    onlyPriceDrops,
    basketCount,
    totalBasketGbp,
    totalBasketTry,
    isLoadingGames,
    catalogError,
    refreshCatalog,
  } = useApp();

  const [activeView, setActiveView] = useState<'catalog' | 'trends'>('catalog');
  const [selectedGameForHistory, setSelectedGameForHistory] = useState<GameItem | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isStoreGuideOpen, setIsStoreGuideOpen] = useState(false);
  const [isDataRefreshOpen, setIsDataRefreshOpen] = useState(false);

  // Filtered & Sorted games
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Platform filter
        if (selectedPlatform !== 'ALL' && game.platform !== selectedPlatform) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = game.title.toLowerCase().includes(q);
          const matchesGenre = game.genre?.toLowerCase().includes(q);
          const matchesPlatform = game.platform.toLowerCase().includes(q);
          if (!matchesTitle && !matchesGenre && !matchesPlatform) {
            return false;
          }
        }

        // Max price filter
        if (game.sellPrice > maxPriceFilter) {
          return false;
        }

        // In stock only filter
        if (onlyInStock && !game.inStock) {
          return false;
        }

        // Only price drops filter
        if (onlyPriceDrops) {
          const discount = calculateDiscount(game.sellPrice, game.originalPrice);
          const hasDrop = (game.priceHistory && game.priceHistory.length > 1 && (game.priceHistory[0].price > game.sellPrice));
          if (discount <= 0 && !hasDrop) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return a.sellPrice - b.sellPrice;
        }
        if (sortBy === 'price_desc') {
          return b.sellPrice - a.sellPrice;
        }
        if (sortBy === 'discount') {
          const discA = calculateDiscount(a.sellPrice, a.originalPrice);
          const discB = calculateDiscount(b.sellPrice, b.originalPrice);
          if (discB !== discA) return discB - discA;
          return a.sellPrice - b.sellPrice;
        }
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [games, selectedPlatform, searchQuery, maxPriceFilter, onlyInStock, onlyPriceDrops, sortBy]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#121212] flex flex-col justify-between pb-20 sm:pb-0">
      
      {/* Top Header */}
      <div>
        <Header
          onOpenBasket={() => setIsBasketOpen(true)}
          onOpenAddGame={() => setIsAddGameOpen(true)}
          onOpenBudgetSettings={() => setIsBudgetSettingsOpen(true)}
          onOpenStoreGuide={() => setIsStoreGuideOpen(true)}
          onOpenDataRefresh={() => setIsDataRefreshOpen(true)}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
          
          {activeView === 'trends' ? (
            <DailyTrendsView
              onOpenPriceHistory={(game) => setSelectedGameForHistory(game)}
              onGoToCatalog={() => setActiveView('catalog')}
            />
          ) : (
            <div>
              {/* Platform and Filters bar */}
              <GameFilters />

              {/* Grid Header / Stats */}
              <div className="flex items-center justify-between gap-2 mb-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-red-500" />
                  <span>
                    Gösterilen: <strong className="text-white font-mono">{filteredGames.length}</strong> / {games.length} Oyun
                  </span>
                  {selectedPlatform !== 'ALL' && (
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-semibold">
                      {selectedPlatform.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <span>
                    Ortalama Fiyat: <strong className="text-white font-mono">
                      £{(filteredGames.reduce((acc, g) => acc + g.sellPrice, 0) / (filteredGames.length || 1)).toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Games Grid */}
              {isLoadingGames ? (
                <div className="py-16 text-center text-sm text-zinc-400">CeX kataloğu yükleniyor...</div>
              ) : catalogError ? (
                <div className="bg-rose-950/30 border border-rose-900 rounded-2xl p-6 text-center text-rose-300">
                  <p className="text-sm font-semibold">{catalogError}</p>
                  <button onClick={() => void refreshCatalog()} className="mt-3 px-4 py-2 bg-zinc-800 rounded-xl text-xs text-white">Tekrar Dene</button>
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="bg-[#181818] border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 max-w-md mx-auto my-8">
                  <FilterX className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                  <h3 className="font-bold text-base text-white">Aradığınız kriterlere uygun oyun bulunamadı</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Filtreleri veya arama terimini değiştirerek tekrar deneyebilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      // reset filters
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onOpenPriceHistory={(g) => setSelectedGameForHistory(g)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Floating Travel Basket Quick Pill (Visible on mobile/tablet) */}
      {basketCount > 0 && !isBasketOpen && (
        <div className="fixed bottom-20 right-3 z-30 sm:bottom-6 sm:right-6 sm:hidden">
          <button
            onClick={() => setIsBasketOpen(true)}
            className="flex items-center gap-3 px-4 py-3 bg-red-600 text-white font-bold rounded-full shadow-2xl border-2 border-white/20 animate-bounce"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {basketCount}
              </span>
            </div>
            <span className="font-mono text-sm">{formatGbp(totalBasketGbp)}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <BasketModal
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
        onOpenBudgetSettings={() => {
          setIsBasketOpen(false);
          setIsBudgetSettingsOpen(true);
        }}
      />

      <PriceHistoryModal
        game={selectedGameForHistory}
        onClose={() => setSelectedGameForHistory(null)}
      />

      <BudgetSettingsModal
        isOpen={isBudgetSettingsOpen}
        onClose={() => setIsBudgetSettingsOpen(false)}
      />

      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
      />

      <StoreGuideModal
        isOpen={isStoreGuideOpen}
        onClose={() => setIsStoreGuideOpen(false)}
      />

      <DataRefreshModal isOpen={isDataRefreshOpen} onClose={() => setIsDataRefreshOpen(false)} />

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-800/80 bg-[#0d0d0d] text-zinc-500 text-xs py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>CeX UK Game Price Tracker & Travel Shopping Basket</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              PS5, PS4, Xbox Series X/S, Xbox One, Xbox 360 oyun fiyat takibi ve seyahat bütçe planlama aracı.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button onClick={() => setIsStoreGuideOpen(true)} className="hover:text-zinc-300 underline">
              UK Mağaza Rehberi
            </button>
            <button onClick={() => setIsBudgetSettingsOpen(true)} className="hover:text-zinc-300 underline">
              Bütçe & Kur
            </button>
            <a
              href="https://uk.webuy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 font-semibold"
            >
              uk.webuy.com Resmi Sitesi ↗
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
