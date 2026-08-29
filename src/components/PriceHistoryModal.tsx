'use client';

import React, { useEffect, useState } from 'react';
import { GameItem, PriceHistoryEntry } from '@/types/game';
import { useApp } from '@/context/AppContext';
import { formatGbp, formatTry, getPlatformBadgeColor } from '@/lib/utils';
import { 
  X, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  History, 
  ExternalLink, 
  Coins, 
  Calendar, 
  Check, 
  Edit3,
  Flame
} from 'lucide-react';

interface PriceHistoryModalProps {
  game: GameItem | null;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ game, onClose }) => {
  const { exchangeRate, updateGamePrice } = useApp();
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [showPriceEdit, setShowPriceEdit] = useState<boolean>(false);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!game) return;
    if (game.id.startsWith('CUSTOM-')) {
      setHistory(game.priceHistory || []);
      setHistoryError(null);
      return;
    }
    let cancelled = false;
    setIsLoadingHistory(true);
    setHistoryError(null);
    fetch(`/api/games/${encodeURIComponent(game.id)}/history`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Fiyat geçmişi alınamadı.');
        if (!cancelled) setHistory(data.history || []);
      })
      .catch((error) => { if (!cancelled) setHistoryError(error.message); })
      .finally(() => { if (!cancelled) setIsLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [game]);

  if (!game) return null;

  const platformColors = getPlatformBadgeColor(game.platform);
  const prices = history.map((h) => h.price);
  const lowestPrice = Math.min(...prices, game.sellPrice);
  const highestPrice = Math.max(...prices, game.sellPrice, game.originalPrice || game.sellPrice);
  const firstPrice = history[0]?.price || game.sellPrice;
  const priceDifference = game.sellPrice - firstPrice;

  const handlePriceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newPriceInput);
    if (!isNaN(val) && val > 0) {
      updateGamePrice(game.id, val);
      setNewPriceInput('');
      setShowPriceEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-white">
      
      <div className="relative w-full max-w-xl bg-[#181818] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#202020] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${platformColors.bg} ${platformColors.text} ${platformColors.border}`}>
                  {game.platform.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-400 font-mono">ID: {game.id}</span>
              </div>
              <h3 className="text-base font-bold text-white line-clamp-1 mt-0.5">
                {game.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          
          {/* Main Price & Trend Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block">Şu Anki CeX Fiyatı</span>
              <span className="text-lg font-black text-white font-mono mt-0.5 block">
                {formatGbp(game.sellPrice)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ≈ {formatTry(game.sellPrice * exchangeRate)}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-center">
              <span className="text-[11px] text-emerald-400 block">En Düşük Fiyat</span>
              <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                {formatGbp(lowestPrice)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {lowestPrice === game.sellPrice ? 'Şu anda en dipte!' : 'Geçmiş kayıt'}
              </span>
            </div>

            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block">Fiyat Değişimi</span>
              <div className="flex items-center justify-center gap-1 mt-0.5 font-mono text-base font-black">
                {priceDifference < 0 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingDown className="w-4 h-4" /> {formatGbp(Math.abs(priceDifference))}
                  </span>
                ) : priceDifference > 0 ? (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <TrendingUp className="w-4 h-4" /> +{formatGbp(priceDifference)}
                  </span>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-0.5">
                    <Minus className="w-4 h-4" /> Değişmedi
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Tarihsel Trend</span>
            </div>
          </div>

          {/* Visual Timeline / Price History Log */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              Fiyat Geçmişi Kayıtları (Günlük Takip)
            </h4>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-3 max-h-48 overflow-y-auto divide-y divide-zinc-800/60">
              {isLoadingHistory ? (
                <div className="py-4 text-center text-xs text-zinc-500">Fiyat geçmişi yükleniyor...</div>
              ) : historyError ? (
                <div className="py-4 text-center text-xs text-rose-400">{historyError}</div>
              ) : history.length > 0 ? (
                history.map((entry, index) => {
                  const isLatest = index === history.length - 1;
                  const prevPrice = index > 0 ? history[index - 1].price : entry.price;
                  const diff = entry.price - prevPrice;

                  return (
                    <div key={index} className="py-2.5 flex items-center justify-between text-xs first:pt-1 last:pb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400">{entry.date}</span>
                        {isLatest && (
                          <span className="bg-red-600/30 text-red-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-500/30">
                            Son Güncel
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        {diff < 0 ? (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                            🔻 {formatGbp(Math.abs(diff))} düştü
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-[11px] text-rose-400 font-semibold flex items-center">
                            🔺 +{formatGbp(diff)} arttı
                          </span>
                        ) : null}

                        <span className="font-bold text-white">
                          {formatGbp(entry.price)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-zinc-500">
                  Henüz geçmiş fiyat kaydı bulunmuyor.
                </div>
              )}
            </div>
          </div>

          {/* Trade-in Value Comparison Box */}
          {(game.cashPrice || game.exchangePrice) && (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>CeX Mağaza Takas / Geri Satış Değerleri</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-300">
                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">Nakit Satarsanız:</span>
                  <span className="font-mono font-bold text-white">£{game.cashPrice?.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400">CeX Kuponu ile:</span>
                  <span className="font-mono font-bold text-amber-300">£{game.exchangePrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual Price Update Tool for User / Admin */}
          {game.id.startsWith('CUSTOM-') && <div className="pt-2">
            {!showPriceEdit ? (
              <button
                onClick={() => setShowPriceEdit(true)}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 underline transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Fiyatı manuel güncelle veya yeni tarih kaydı gir</span>
              </button>
            ) : (
              <form onSubmit={handlePriceUpdate} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                <span className="text-xs text-zinc-400">Yeni Fiyat (£):</span>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  placeholder="Örn: 24.50"
                  className="bg-zinc-800 border border-zinc-600 rounded-lg px-2.5 py-1 text-xs text-white w-28 focus:outline-none focus:border-red-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowPriceEdit(false)}
                  className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
                >
                  İptal
                </button>
              </form>
            )}
          </div>}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#202020] border-t border-zinc-800 flex items-center justify-between">
          <a
            href={game.cexUrl || `https://uk.webuy.com/search?stext=${encodeURIComponent(game.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5"
          >
            <span>CeX UK Resmi Ürün Sayfasına Git</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>

    </div>
  );
};
