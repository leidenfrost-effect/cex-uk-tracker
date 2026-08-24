'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { GameItem } from '@/types/game';
import { formatGbp, formatTry, calculateDiscount, getPlatformBadgeColor } from '@/lib/utils';
import { 
  TrendingDown, 
  Flame, 
  Sparkles, 
  Coins, 
  Tag, 
  ShoppingBag, 
  History, 
  Award,
  ArrowRight
} from 'lucide-react';

interface DailyTrendsViewProps {
  onOpenPriceHistory: (game: GameItem) => void;
  onGoToCatalog: () => void;
}

export const DailyTrendsView: React.FC<DailyTrendsViewProps> = ({
  onOpenPriceHistory,
  onGoToCatalog,
}) => {
  const { games, addToBasket, basket, exchangeRate } = useApp();

  // Sort by biggest discount / price drop
  const discountedGames = games
    .map((g) => ({
      ...g,
      discountPercent: calculateDiscount(g.sellPrice, g.originalPrice),
      priceDiff: (g.originalPrice || g.sellPrice) - g.sellPrice,
    }))
    .filter((g) => g.discountPercent > 0 || g.priceDiff > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent);

  // Bargains under £10
  const under10Games = games
    .filter((g) => g.sellPrice <= 10)
    .sort((a, b) => a.sellPrice - b.sellPrice);

  // Bargains under £20
  const under20Games = games
    .filter((g) => g.sellPrice > 10 && g.sellPrice <= 20)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-white">
      
      {/* Hero Banner for Daily Tracking */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-950 via-[#181818] to-zinc-900 border border-red-900/40 p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Günün Fiyat Değişimleri & Takip Raporu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            CeX UK Günlük Fiyat Takibi
          </h2>
          <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
            İngiltere seyahatiniz öncesi fiyatı en çok düşen oyunları, 10 £ altı efsane yapımları ve seyahat bütçenizi en verimli kullanabileceğiniz fırsatları anlık inceleyin.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="bg-black/50 px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-300">
              📊 Toplam Takip Edilen: <strong className="text-white">{games.length} Oyun</strong>
            </span>
            <span className="bg-black/50 px-3 py-1.5 rounded-xl border border-zinc-700 text-emerald-400">
              🔥 İndirimdeki Oyunlar: <strong>{discountedGames.length} Adet</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Top Deals / Price Drops */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">En Yüksek Fiyat Düşüşleri</h3>
              <p className="text-xs text-zinc-400">Orijinal etiketine göre en yüksek oranda ucuzlayanlar</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discountedGames.slice(0, 6).map((game) => {
            const platformColors = getPlatformBadgeColor(game.platform);
            const isInBasket = basket.some((i) => i.game.id === game.id);

            return (
              <div
                key={game.id}
                className="bg-[#1c1c1c] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all"
              >
                <div className="flex gap-3">
                  <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-20 h-20 rounded-xl object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${platformColors.bg} ${platformColors.text} ${platformColors.border}`}>
                        {game.platform.replace('_', ' ')}
                      </span>
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-300" /> -%{game.discountPercent}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white line-clamp-1" title={game.title}>
                      {game.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{game.genre}</p>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-white font-mono">
                        {formatGbp(game.sellPrice)}
                      </span>
                      {game.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through font-mono">
                          {formatGbp(game.originalPrice)}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ≈ {formatTry(game.sellPrice * exchangeRate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenPriceHistory(game)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Geçmiş</span>
                  </button>

                  <button
                    onClick={() => addToBasket(game)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isInBasket
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isInBasket ? 'Sepette' : 'Sepete Ekle'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Under £10 Bargains (Fiyat/Performans Canavarları) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">10 £ Altı Kelepir Fırsatlar</h3>
              <p className="text-xs text-zinc-400">Küçük bütçeyle çantayı doldurabileceğiniz nostaljik ve efsane oyunlar</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {under10Games.map((game) => {
            const platformColors = getPlatformBadgeColor(game.platform);
            const isInBasket = basket.some((i) => i.game.id === game.id);

            return (
              <div
                key={game.id}
                className="bg-[#1a1a1a] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${platformColors.bg} ${platformColors.text} ${platformColors.border}`}>
                      {game.platform.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      £{game.sellPrice.toFixed(2)}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-zinc-100 line-clamp-2 min-h-[2rem]" title={game.title}>
                    {game.title}
                  </h5>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ≈ {formatTry(game.sellPrice * exchangeRate)}
                  </span>
                  <button
                    onClick={() => addToBasket(game)}
                    className="p-1.5 bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white rounded-lg transition-colors"
                    title="Sepete Ekle"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to full catalog button */}
      <div className="text-center pt-4">
        <button
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-zinc-700 transition-colors shadow-lg"
        >
          <span>Tüm Kataloğu ve Filtreleri İncele</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
