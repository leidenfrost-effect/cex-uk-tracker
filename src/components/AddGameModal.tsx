'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Platform } from '@/types/game';
import { X, PlusCircle, Gamepad2, Check } from 'lucide-react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose }) => {
  const { addCustomGame } = useApp();

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('PS5');
  const [sellPrice, setSellPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('4.8');
  const [imageUrl, setImageUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sellPrice) return;

    const price = parseFloat(sellPrice);
    const origPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    const defaultImg =
      imageUrl ||
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';

    addCustomGame({
      title,
      platform,
      categoryName: `${platform} Software`,
      sellPrice: price,
      originalPrice: origPrice,
      imageUrl: defaultImg,
      inStock: true,
      stockCount: 5,
      condition: 'Boxed',
      rating: parseFloat(rating) || 4.5,
      genre: genre || 'Aksiyon',
      cexUrl: `https://uk.webuy.com/search?stext=${encodeURIComponent(title)}`,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 text-white backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      
      <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#181818] shadow-2xl sm:my-4 sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#202020] flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">
                Kataloğa Yeni Oyun Ekle
              </h3>
              <p className="hidden text-xs text-zinc-400 sm:block">
                CeX UK'de gördüğünüz özel bir oyunu listenize dahil edin
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
        <form onSubmit={handleSubmit} className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-4 space-y-4 text-xs sm:p-5 sm:max-h-none">
          
          <div>
            <label className="font-bold text-zinc-300 block mb-1">Oyun Adı *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Ghost of Tsushima Director's Cut"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">Platform *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="PS5">PlayStation 5</option>
                <option value="PS4">PlayStation 4</option>
                <option value="XBOX_SX">Xbox Series X/S</option>
                <option value="XBOX_ONE">Xbox One</option>
                <option value="XBOX_360">Xbox 360</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Tür / Türler</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Örn: Açık Dünya RPG"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <div>
              <label className="font-bold text-zinc-300 block mb-1">CeX Satış Fiyatı (£) *</label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Örn: 22.00"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-300 block mb-1">Eski / Orijinal Fiyat (£)</label>
              <input
                type="number"
                step="0.50"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Örn: 30.00 (Opsiyonel)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-300 block mb-1">Kapak Resmi URL (Opsiyonel)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Oyun Eklendi!</span>
                </>
              ) : (
                <span>Kataloğa Ekle</span>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
