'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PriorityLevel } from '@/types/game';
import { POPULAR_UK_CEX_STORES } from '@/data/initialGames';
import { 
  formatGbp, 
  formatTry, 
  getPlatformBadgeColor, 
  getPriorityMeta 
} from '@/lib/utils';
import { 
  X, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Printer, 
  Download, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Plane,
  Sparkles
} from 'lucide-react';

interface BasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBudgetSettings: () => void;
}

export const BasketModal: React.FC<BasketModalProps> = ({
  isOpen,
  onClose,
  onOpenBudgetSettings,
}) => {
  const {
    basket,
    removeFromBasket,
    updateBasketPriority,
    updateBasketStore,
    updateBasketNotes,
    togglePurchased,
    clearBasket,
    totalBasketGbp,
    totalBasketTry,
    budgetLimitGbp,
    exchangeRate,
    purchasedBasketGbp,
    addToBasket,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unpurchased' | 'purchased'>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOverBudget = totalBasketGbp > budgetLimitGbp;
  const budgetDiff = Math.abs(budgetLimitGbp - totalBasketGbp);

  const filteredBasket = basket.filter((item) => {
    if (activeFilter === 'purchased') return item.purchased;
    if (activeFilter === 'unpurchased') return !item.purchased;
    return true;
  });

  // Sort: unpurchased first, then by priority
  const priorityWeight: Record<PriorityLevel, number> = {
    must_buy: 1,
    high: 2,
    nice_to_have: 3,
    backup: 4,
  };

  const sortedBasket = [...filteredBasket].sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Durum', 'Oncelik', 'Oyun Adi', 'Platform', 'Fiyat GBP', 'Fiyat TRY', 'Hedef Magaza', 'Notlar'];
    const rows = basket.map((item) => [
      item.purchased ? 'Alindi' : 'Bekliyor',
      getPriorityMeta(item.priority).label,
      `"${item.game.title.replace(/"/g, '""')}"`,
      item.game.platform,
      item.game.sellPrice.toFixed(2),
      (item.game.sellPrice * exchangeRate).toFixed(0),
      `"${(item.targetStore || 'Belirtilmedi').replace(/"/g, '""')}"`,
      `"${(item.userNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CeX_UK_Seyahat_Sepeti_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#161616] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#1c1c1c] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">İngiltere Seyahat Sepetim</h2>
                <span className="bg-red-600/30 text-red-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold border border-red-500/30">
                  {basket.length} Oyun
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Mağaza ziyaretleri öncesi bütçenizi ve alınacaklar listenizi yönetin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
              title="Yazdır veya PDF Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
              title="Excel / CSV İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Budget Status Bar */}
        <div className={`px-5 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
          isOverBudget ? 'bg-rose-950/60 border-rose-800/80 text-rose-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
        }`}>
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Plane className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>
              Toplam Tutar: <strong className="text-white font-mono text-sm">{formatGbp(totalBasketGbp)}</strong> ≈ <span className="font-mono">{formatTry(totalBasketTry)}</span>
            </span>
            <span className="text-zinc-500">|</span>
            <span>
              Bütçe: <strong className="text-white font-mono">{formatGbp(budgetLimitGbp)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isOverBudget ? (
              <span className="font-bold text-rose-400">
                ⚠️ Bütçe {formatGbp(budgetDiff)} aşıldı!
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                Kalan: {formatGbp(budgetDiff)}
              </span>
            )}
            <button
              onClick={onOpenBudgetSettings}
              className="underline text-[11px] hover:text-white transition-colors"
            >
              Bütçeyi Düzenle
            </button>
          </div>
        </div>

        {/* Filter Tabs & Quick Stats */}
        <div className="p-3 px-5 bg-[#181818] border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tümü ({basket.length})
            </button>
            <button
              onClick={() => setActiveFilter('unpurchased')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'unpurchased' ? 'bg-red-600/80 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Alınacaklar ({basket.filter((i) => !i.purchased).length})
            </button>
            <button
              onClick={() => setActiveFilter('purchased')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilter === 'purchased' ? 'bg-emerald-600/80 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Alınanlar ({basket.filter((i) => i.purchased).length})
            </button>
          </div>

          {basket.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Sepetteki tüm oyunları temizlemek istediğinizden emin misiniz?')) {
                  clearBasket();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sepeti Temizle</span>
            </button>
          )}
        </div>

        {/* Basket List Items Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {sortedBasket.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p className="font-semibold text-zinc-300">Sepetinizde oyun bulunmuyor</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Katalogdan İngiltere seyahatinizde satın almak istediğiniz PS4/PS5 ve Xbox oyunlarını ekleyin.
              </p>
            </div>
          ) : (
            sortedBasket.map((item) => {
              const platformColors = getPlatformBadgeColor(item.game.platform);
              const priorityMeta = getPriorityMeta(item.priority);
              const isNotesOpen = editingNotesId === item.game.id;

              return (
                <div
                  key={item.game.id}
                  className={`p-3 sm:p-4 rounded-xl border transition-all ${
                    item.purchased
                      ? 'bg-zinc-900/40 border-zinc-800/50 opacity-60'
                      : 'bg-[#1e1e1e] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Checkbox + Thumbnail + Details */}
                    <div className="flex items-center gap-3">
                      {/* Purchased Toggle Checkbox */}
                      <button
                        onClick={() => togglePurchased(item.game.id)}
                        className="text-zinc-400 hover:text-emerald-400 transition-colors p-1"
                        title={item.purchased ? 'Alındı işaretini kaldır' : 'Mağazada Alındı Olarak İşaretle'}
                      >
                        {item.purchased ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>

                      {/* Game Image */}
                      <img
                        src={item.game.imageUrl}
                        alt={item.game.title}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-700"
                      />

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${platformColors.bg} ${platformColors.text} ${platformColors.border}`}>
                            {item.game.platform.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityMeta.badge}`}>
                            {priorityMeta.label}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold mt-1 text-white ${item.purchased ? 'line-through text-zinc-400' : ''}`}>
                          {item.game.title}
                        </h4>
                      </div>
                    </div>

                    {/* Right: Quantity, Price, Priority, Actions */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                      
                      {/* Priority Selector */}
                      <select
                        value={item.priority}
                        onChange={(e) => updateBasketPriority(item.game.id, e.target.value as PriorityLevel)}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                        title="Öncelik Seviyesi"
                      >
                        <option value="must_buy">🔥 Kesin Alınacak</option>
                        <option value="high">⭐ Yüksek Öncelik</option>
                        <option value="nice_to_have">👍 Fiyatı Uygunsa</option>
                        <option value="backup">🎯 Alternatif</option>
                      </select>

                      {/* Store Selector */}
                      <select
                        value={item.targetStore || ''}
                        onChange={(e) => updateBasketStore(item.game.id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] rounded-lg px-2 py-1 max-w-[140px] truncate focus:outline-none cursor-pointer"
                        title="Hedef Mağaza"
                      >
                        <option value="">🏪 Mağaza Seç...</option>
                        {POPULAR_UK_CEX_STORES.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      {/* Price Tag */}
                      <div className="text-right font-mono min-w-[70px]">
                        <div className="text-sm font-bold text-white">
                          {formatGbp(item.game.sellPrice * item.quantity)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {formatTry(item.game.sellPrice * item.quantity * exchangeRate)}
                        </div>
                      </div>

                      {/* Notes Button */}
                      <button
                        onClick={() => setEditingNotesId(isNotesOpen ? null : item.game.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          item.userNotes ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                        title="Not Ekle"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromBasket(item.game.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 bg-zinc-900 border border-zinc-800 hover:border-rose-900 rounded-lg transition-colors"
                        title="Sepetten Çıkar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* Collapsible Personal Store / Travel Notes */}
                  {isNotesOpen && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.userNotes || ''}
                          onChange={(e) => updateBasketNotes(item.game.id, e.target.value)}
                          placeholder="Özel seyahat notu ekleyin (örn: Tottenham Court şubesinde kontrol et, Steelbook ara)..."
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                        />
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Tamam
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notes Preview if not editing */}
                  {!isNotesOpen && item.userNotes && (
                    <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-900/40 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Not: {item.userNotes}</span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1c1c1c] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400">
            <span>Toplam: <strong className="text-white font-mono">{basket.length} oyun</strong></span>
            {basket.filter((i) => i.purchased).length > 0 && (
              <span className="ml-2 text-emerald-400">
                ({basket.filter((i) => i.purchased).length} satın alındı - {formatGbp(purchasedBasketGbp)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Kataloğa Dön
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
