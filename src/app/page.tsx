'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GameItem } from '@/types/game';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { GameFilters } from '@/components/GameFilters';
import { GameCard } from '@/components/GameCard';
import { BasketModal } from '@/components/BasketModal';
import { PriceHistoryModal } from '@/components/PriceHistoryModal';
import { DailyTrendsView } from '@/components/DailyTrendsView';
import { BudgetSettingsModal } from '@/components/BudgetSettingsModal';
import { AddGameModal } from '@/components/AddGameModal';
import { StoreGuideModal } from '@/components/StoreGuideModal';
import { DataRefreshModal } from '@/components/DataRefreshModal';
import { formatGbp } from '@/lib/utils';
import { FilterX, Gamepad2, LoaderCircle, ShoppingBag } from 'lucide-react';

export default function Home() {
  const { games, selectedPlatform, basketCount, totalBasketGbp, isLoadingGames, isLoadingMore, hasMoreGames, catalogError, catalogMeta, refreshCatalog, loadMoreGames } = useApp();
  const [activeView, setActiveView] = useState<'catalog' | 'trends'>('catalog');
  const [selectedGameForHistory, setSelectedGameForHistory] = useState<GameItem | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isBudgetSettingsOpen, setIsBudgetSettingsOpen] = useState(false);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isStoreGuideOpen, setIsStoreGuideOpen] = useState(false);
  const [isDataRefreshOpen, setIsDataRefreshOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#121212] pb-20 sm:pb-0">
      <Header onOpenBasket={() => setIsBasketOpen(true)} onOpenAddGame={() => setIsAddGameOpen(true)} onOpenBudgetSettings={() => setIsBudgetSettingsOpen(true)} onOpenStoreGuide={() => setIsStoreGuideOpen(true)} onOpenDataRefresh={() => setIsDataRefreshOpen(true)} activeView={activeView} setActiveView={setActiveView} />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        {activeView === 'trends' ? <DailyTrendsView onOpenPriceHistory={setSelectedGameForHistory} onGoToCatalog={() => setActiveView('catalog')} /> : <div>
          <GameFilters />
          <div className="mb-4 flex items-center justify-between gap-2 text-xs text-zinc-400"><div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-red-500" /><span>Gösterilen: <strong className="font-mono text-white">{games.length}</strong> / {catalogMeta.total} oyun</span>{selectedPlatform !== 'ALL' && <span className="rounded bg-zinc-800 px-2 py-0.5 font-semibold text-zinc-300">{selectedPlatform.replace('_', ' ')}</span>}</div><span className="hidden sm:block">Sayfalı katalog · hızlı yükleme</span></div>
          {isLoadingGames ? <div className="py-16 text-center text-sm text-zinc-400">CeX kataloğu yükleniyor...</div> : catalogError ? <div className="rounded-2xl border border-rose-900 bg-rose-950/30 p-6 text-center text-rose-300"><p className="text-sm font-semibold">{catalogError}</p><button onClick={() => void refreshCatalog()} className="mt-3 rounded-xl bg-zinc-800 px-4 py-2 text-xs text-white">Tekrar Dene</button></div> : games.length === 0 ? <div className="mx-auto my-8 max-w-md rounded-3xl border border-zinc-800 bg-[#181818] p-12 text-center text-zinc-400"><FilterX className="mx-auto mb-3 h-12 w-12 text-zinc-600" /><h3 className="text-base font-bold text-white">Uygun oyun bulunamadı</h3><p className="mt-1 text-xs text-zinc-500">Filtreleri veya arama terimini değiştirin.</p></div> : <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{games.map((game) => <GameCard key={game.id} game={game} onOpenPriceHistory={setSelectedGameForHistory} />)}</div>{hasMoreGames && <div className="py-8 text-center"><button onClick={() => void loadMoreGames()} disabled={isLoadingMore} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-70">{isLoadingMore && <LoaderCircle className="h-4 w-4 animate-spin" />}{isLoadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}</button></div>}</>}
        </div>}
      </main>
      {basketCount > 0 && !isBasketOpen && <div className="fixed bottom-20 right-3 z-30 sm:bottom-6 sm:right-6 sm:hidden"><button onClick={() => setIsBasketOpen(true)} className="flex items-center gap-3 rounded-full border-2 border-white/20 bg-red-600 px-4 py-3 font-bold text-white shadow-2xl"><ShoppingBag className="h-5 w-5" /><span className="font-mono text-sm">{formatGbp(totalBasketGbp)}</span></button></div>}
      <MobileBottomNav activeView={activeView} setActiveView={setActiveView} basketCount={basketCount} onOpenBasket={() => setIsBasketOpen(true)} onOpenAddGame={() => setIsAddGameOpen(true)} onOpenBudgetSettings={() => setIsBudgetSettingsOpen(true)} />
      <BasketModal isOpen={isBasketOpen} onClose={() => setIsBasketOpen(false)} onOpenBudgetSettings={() => { setIsBasketOpen(false); setIsBudgetSettingsOpen(true); }} />
      <PriceHistoryModal game={selectedGameForHistory} onClose={() => setSelectedGameForHistory(null)} />
      <BudgetSettingsModal isOpen={isBudgetSettingsOpen} onClose={() => setIsBudgetSettingsOpen(false)} />
      <AddGameModal isOpen={isAddGameOpen} onClose={() => setIsAddGameOpen(false)} />
      <StoreGuideModal isOpen={isStoreGuideOpen} onClose={() => setIsStoreGuideOpen(false)} />
      <DataRefreshModal isOpen={isDataRefreshOpen} onClose={() => setIsDataRefreshOpen(false)} />
      <footer className="mt-12 border-t border-zinc-800/80 bg-[#0d0d0d] px-4 py-8 text-xs text-zinc-500"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"><div><div className="flex items-center justify-center gap-2 font-bold text-zinc-300 sm:justify-start"><span className="h-2 w-2 rounded-full bg-red-600" />CeX UK Game Price Tracker & Travel Shopping Basket</div><p className="mt-1 text-[11px]">PS5, PS4, Xbox Series X/S, Xbox One ve Xbox 360 fiyat takibi.</p></div><div className="flex flex-wrap items-center justify-center gap-4 text-[11px]"><button onClick={() => setIsStoreGuideOpen(true)} className="underline hover:text-zinc-300">UK Mağaza Rehberi</button><button onClick={() => setIsBudgetSettingsOpen(true)} className="underline hover:text-zinc-300">Bütçe & Kur</button><a href="https://uk.webuy.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-400 hover:text-red-300">uk.webuy.com Resmi Sitesi ↗</a></div></div></footer>
    </div>
  );
}
