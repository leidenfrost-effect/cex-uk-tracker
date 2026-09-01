'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatGbp, formatTry } from '@/lib/utils';
import { 
  X, 
  Settings, 
  PoundSterling, 
  Wallet, 
  RefreshCw, 
  Check, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    budgetLimitGbp,
    setBudgetLimitGbp,
    exchangeRate,
    setCustomExchangeRate,
    isCustomRate,
    resetToDefaultGames,
  } = useApp();

  const [budgetInput, setBudgetInput] = useState<string>(String(budgetLimitGbp));
  const [rateInput, setRateInput] = useState<string>(String(exchangeRate.toFixed(2)));
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(budgetInput);
    if (!isNaN(b) && b > 0) {
      setBudgetLimitGbp(b);
    }

    const r = parseFloat(rateInput);
    if (!isNaN(r) && r > 0) {
      setCustomExchangeRate(r);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetLiveRate = () => {
    setCustomExchangeRate(null);
    setRateInput('44.80');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 text-white backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      
      <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:my-4 sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-800 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">
                Bütçe ve Döviz Kuru Ayarları
              </h3>
              <p className="hidden text-xs text-zinc-400 sm:block">
                İngiltere seyahat harcamalarınızı ve TRY karşılıklarını özelleştirin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-4 space-y-5 sm:p-5 sm:max-h-none">
          
          {/* Travel Budget Setting */}
          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Seyahat Oyun Bütçesi (£ GBP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">£</span>
              <input
                type="number"
                min="10"
                step="10"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                placeholder="Örn: 300"
                required
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-400">Hızlı Seçim:</span>
              {[150, 250, 350, 500].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBudgetInput(String(amount))}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-mono text-zinc-300 transition-colors"
                >
                  £{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Exchange Rate Setting */}
          <div className="pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                1 GBP / TRY Döviz Kuru (₺)
              </label>
              {isCustomRate && (
                <button
                  type="button"
                  onClick={handleResetLiveRate}
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Canlı Kura Dön
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₺</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                placeholder="Örn: 44.80"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              💡 Bankanızın yurt dışı kart komisyonlu kurunu girerek harcamanızı birebir hesaplayabilirsiniz.
            </p>
          </div>

          {/* Reset Catalog Option */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3 text-xs">
            <span className="text-zinc-400">Katalog Verilerini Sıfırla:</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Tüm oyun kataloğunu orijinal CeX verilerine döndürmek istiyor musunuz?')) {
                  resetToDefaultGames();
                  alert('Katalog sıfırlandı!');
                }
              }}
              className="text-zinc-400 hover:text-white underline text-xs"
            >
              Varsayılana Sıfırla
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Ayarlar Kaydedildi!</span>
                </>
              ) : (
                <span>Ayarları Kaydet</span>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
