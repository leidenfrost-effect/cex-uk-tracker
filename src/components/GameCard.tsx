'use client';

import React, { useState } from 'react';
import { GameItem } from '@/types/game';
import { useApp } from '@/context/AppContext';
import { 
  formatGbp, 
  formatTry, 
  calculateDiscount, 
  getPlatformBadgeColor, 
  getPlatformLabel,
  getPriorityMeta 
} from '@/lib/utils';
import { 
  ShoppingBag, 
  History, 
  ExternalLink, 
  Check, 
  Star, 
  TrendingDown, 
  Flame,
  ShieldCheck,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameCardProps {
  game: GameItem;
  onOpenPriceHistory: (game: GameItem) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onOpenPriceHistory }) => {
  const { basket, addToBasket, removeFromBasket, exchangeRate } = useApp();
  const [justAdded, setJustAdded] = useState(false);

  const basketEntry = basket.find((item) => item.game.id === game.id);
  const isInBasket = !!basketEntry;

  const discountPercent = calculateDiscount(game.sellPrice, game.originalPrice);
  const platformColors = getPlatformBadgeColor(game.platform);
  const tryPrice = game.sellPrice * exchangeRate;

  // Price trend calculation
  const history = game.priceHistory || [];
  const hasHistory = history.length > 1;
  const initialPrice = history[0]?.price || game.sellPrice;
  const priceDiff = initialPrice - game.sellPrice;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToBasket(game);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);

    // Fire minor confetti
    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.85 },
        colors: ['#E00000', '#ffffff', '#107C10', '#0070D1'],
      });
    } catch {}
  };

  return (
    <div className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-800 bg-[#1c1c1c] p-3 shadow-md transition-all duration-200 hover:border-zinc-700/90 hover:bg-[#222222] hover:shadow-xl sm:p-4">
      
      {/* Top Media & Platform Header */}
      <div>
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-zinc-800/80">
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Platform Badge (Top Left) */}
          <div className="absolute top-2 left-2">
            <span
              className={`text-[10px] font-black tracking-wider px-2 py-1 rounded-md border backdrop-blur-md shadow-md ${platformColors.bg} ${platformColors.text} ${platformColors.border}`}
            >
              {game.platform.replace('_', ' ')}
            </span>
          </div>

          {/* Discount / Deal Badges (Top Right) */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {discountPercent > 0 && (
              <span className="flex items-center gap-1 bg-red-600/90 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-md backdrop-blur-md border border-red-400/40">
                <Flame className="w-3 h-3 text-amber-300" />
                -%{discountPercent}
              </span>
            )}
            {game.popular && (
              <span className="bg-amber-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                POPÜLER
              </span>
            )}
          </div>

          {/* In Basket Indicator Overlay */}
          {isInBasket && (
            <div className="absolute bottom-2 left-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 backdrop-blur-md ${getPriorityMeta(basketEntry.priority).badge}`}>
                <Check className="w-3 h-3" /> Sepette ({basketEntry.quantity})
              </span>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 mb-1">
            <span className="truncate">{game.genre || 'Konsol Oyunu'}</span>
            {game.rating && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                <Star className="w-3 h-3 fill-amber-400" />
                {game.rating.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="min-w-0 font-bold text-sm text-zinc-100 line-clamp-2 min-h-[2.5rem] leading-snug transition-colors group-hover:text-white" title={game.title}>
            {game.title}
          </h3>

          {/* Condition & Stock */}
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium">
              {game.condition || 'Boxed'}
            </span>
            <span className={`flex items-center gap-1 font-medium ${game.inStock ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${game.inStock ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              {game.inStock
                ? game.stockCount !== undefined ? `Stokta (${game.stockCount})` : 'Stokta'
                : 'Tükendi'}
            </span>
          </div>

          {/* CeX Buyback Trade-in Info (Cash & Voucher) */}
          {(game.cashPrice || game.exchangePrice) && (
            <div className="mt-2.5 flex flex-col items-start gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/90 p-2 text-[10px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1 text-zinc-400">
                <Coins className="w-3 h-3 text-amber-400" /> CeX Geri Alış:
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono">
                {game.cashPrice && (
                  <span title="Nakit Geri Alış Fiyatı">
                    Nakit: <strong className="text-zinc-200">£{game.cashPrice.toFixed(2)}</strong>
                  </span>
                )}
                {game.exchangePrice && (
                  <span title="Kupon / Takas Değeri" className="text-amber-300">
                    Kupon: <strong>£{game.exchangePrice.toFixed(2)}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Price & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white font-mono tracking-tight">
                {formatGbp(game.sellPrice)}
              </span>
              {game.originalPrice && game.originalPrice > game.sellPrice && (
                <span className="text-xs text-zinc-500 line-through font-mono">
                  {formatGbp(game.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              ≈ {formatTry(tryPrice)}
            </div>
          </div>

          {/* Price History Button */}
          <button
            onClick={() => onOpenPriceHistory(game)}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 rounded-lg border border-zinc-700/60 transition-colors"
            title="Fiyat Geçmişi Grafiğini Gör"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>Geçmiş</span>
          </button>
        </div>

        {/* Card Actions */}
        <div className="grid grid-cols-5 gap-2">
          {/* Add to Basket Button */}
          <button
            onClick={handleAdd}
            className={`col-span-4 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : isInBasket
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>Sepete Eklendi!</span>
              </>
            ) : isInBasket ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tekrar Ekle (+1)</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Seyahat Sepetime Ekle</span>
              </>
            )}
          </button>

          {/* External CeX Store Link */}
          <a
            href={game.cexUrl || `https://uk.webuy.com/search?stext=${encodeURIComponent(game.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl flex items-center justify-center transition-colors"
            title="CeX UK Resmi Sayfasında Aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
