'use client';

import React from 'react';
import { POPULAR_UK_CEX_STORES } from '@/data/initialGames';
import { X, MapPin, ExternalLink, Lightbulb, ShieldAlert, CheckCircle, Navigation } from 'lucide-react';

interface StoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreGuideModal: React.FC<StoreGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 text-white backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      
      <div className="relative my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#181818] shadow-2xl sm:my-4 sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#202020] flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">
                İngiltere Seyahati: CeX Mağaza Rehberi & İpuçları
              </h3>
              <p className="hidden text-xs text-zinc-400 sm:block">
                Londra ve UK'deki en büyük şubeler ve alışveriş tavsiyeleri
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

        {/* Content */}
        <div className="min-h-0 overflow-y-auto p-4 space-y-6 text-xs sm:p-5">
          
          {/* Important Travel Tips */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>CeX Alışverişinde Bilmeniz Gereken Önemli Noktalar</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 pl-4 list-disc">
              <li>
                <strong>Disk Durumu (Condition):</strong> CeX vitrininde kutular boş durur. Kasaya götürdüğünüzde diski arkadan getirirler. Ödeme yapmadan önce <em>diskte çizik veya leke olup olmadığını kontrol edin</em>, gerekirse başka kopyasını isteyin.
              </li>
              <li>
                <strong>Bölge Kodu (Region Free):</strong> PS4, PS5 ve Xbox One/Series X oyunları bölge kilitsizdir (Region Free). İngiltere'den aldığınız diskler Türkiye'deki konsolunuzda sorunsuz çalışır.
              </li>
              <li>
                <strong>Xbox 360 Uyumluluğu:</strong> Xbox 360 oyunlarının %90'ı PAL bölgesidir ve Türkiye cihazlarıyla uyumludur. Ayrıca çoğu Xbox One ve Series X'te geriye dönük uyumlulukla (Backwards Compatible) tak-çalıştır oynanabilir.
              </li>
              <li>
                <strong>24 Ay Garanti:</strong> CeX tüm ikinci el oyun ve konsollara 24 ay mağaza garantisi vermektedir.
              </li>
            </ul>
          </div>

          {/* Popular Stores in London & UK */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-red-500" />
              Popüler ve En Çok Stok Bulunan CeX Şubeleri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POPULAR_UK_CEX_STORES.map((store) => (
                <div
                  key={store.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-white text-xs">{store.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800">
                        {store.city}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{store.address}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">{store.region}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Haritada Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 bg-[#202020] p-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Anladım, Kapat
          </button>
        </div>

      </div>

    </div>
  );
};
