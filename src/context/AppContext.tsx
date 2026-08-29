'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  BasketItem, CatalogMeta, ExchangeRateSnapshot, GameItem, Platform, PriceHistoryEntry, PriorityLevel,
} from '@/types/game';

interface AppContextType {
  games: GameItem[];
  basket: BasketItem[];
  exchangeRate: number;
  exchangeRateMeta: ExchangeRateSnapshot | null;
  isCustomRate: boolean;
  budgetLimitGbp: number;
  selectedPlatform: 'ALL' | Platform;
  searchQuery: string;
  sortBy: 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating';
  maxPriceFilter: number;
  onlyInStock: boolean;
  onlyPriceDrops: boolean;
  isLoadingRate: boolean;
  isLoadingGames: boolean;
  catalogError: string | null;
  catalogMeta: CatalogMeta;
  refreshCatalog: () => Promise<void>;
  setSelectedPlatform: (p: 'ALL' | Platform) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating') => void;
  setMaxPriceFilter: (p: number) => void;
  setOnlyInStock: (v: boolean) => void;
  setOnlyPriceDrops: (v: boolean) => void;
  setBudgetLimitGbp: (limit: number) => void;
  setCustomExchangeRate: (rate: number | null) => void;
  addToBasket: (game: GameItem, priority?: PriorityLevel, targetStore?: string, userNotes?: string) => void;
  removeFromBasket: (gameId: string) => void;
  updateBasketPriority: (gameId: string, priority: PriorityLevel) => void;
  updateBasketStore: (gameId: string, targetStore: string) => void;
  updateBasketNotes: (gameId: string, notes: string) => void;
  togglePurchased: (gameId: string) => void;
  clearBasket: () => void;
  addCustomGame: (game: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => void;
  updateGamePrice: (gameId: string, newPrice: number) => void;
  resetToDefaultGames: () => void;
  totalBasketGbp: number;
  totalBasketTry: number;
  purchasedBasketGbp: number;
  remainingBudgetGbp: number;
  basketCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const BASKET_KEY = 'cex_travel_basket_v1';
const LEGACY_GAMES_KEY = 'cex_custom_games_v1';
const CUSTOM_GAMES_KEY = 'cex_custom_games_v2';
const BUDGET_KEY = 'cex_travel_budget_v1';
const RATE_KEY = 'cex_custom_rate_v1';
const EMPTY_META: CatalogMeta = { total: 0, countsByPlatform: {}, lastSuccessfulSyncAt: null };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [serverGames, setServerGames] = useState<GameItem[]>([]);
  const [customGames, setCustomGames] = useState<GameItem[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [exchangeRateMeta, setExchangeRateMeta] = useState<ExchangeRateSnapshot | null>(null);
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [budgetLimitGbp, setBudgetLimitGbp] = useState(300);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>(EMPTY_META);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | Platform>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<AppContextType['sortBy']>('discount');
  const [maxPriceFilter, setMaxPriceFilter] = useState(100);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPriceDrops, setOnlyPriceDrops] = useState(false);

  const games = useMemo(() => [...customGames, ...serverGames], [customGames, serverGames]);

  const refreshCatalog = useCallback(async () => {
    setIsLoadingGames(true);
    setCatalogError(null);
    try {
      const pageSize = 5000;
      const response = await fetch(`/api/games?page=1&pageSize=${pageSize}&sort=title`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Katalog alınamadı.');
      const pageCount = Math.ceil(data.total / pageSize);
      const remainingPages = pageCount > 1
        ? await Promise.all(Array.from({ length: pageCount - 1 }, async (_, index) => {
            const pageResponse = await fetch(`/api/games?page=${index + 2}&pageSize=${pageSize}&sort=title`, { cache: 'no-store' });
            const pageData = await pageResponse.json();
            if (!pageResponse.ok || !pageData.success) throw new Error(pageData.error || 'Katalog sayfası alınamadı.');
            return pageData.games as GameItem[];
          }))
        : [];
      setServerGames([...(data.games as GameItem[]), ...remainingPages.flat()]);
      setCatalogMeta({
        total: data.total,
        countsByPlatform: data.countsByPlatform || {},
        lastSuccessfulSyncAt: data.lastSuccessfulSyncAt || null,
      });
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Katalog alınamadı.');
    } finally {
      setIsLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedBasket = localStorage.getItem(BASKET_KEY);
      if (savedBasket) setBasket(JSON.parse(savedBasket));
      const savedCustom = localStorage.getItem(CUSTOM_GAMES_KEY) || localStorage.getItem(LEGACY_GAMES_KEY);
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom) as GameItem[];
        setCustomGames(parsed.filter((game) => game.id?.startsWith('CUSTOM-')));
      }
      const savedBudget = localStorage.getItem(BUDGET_KEY);
      if (savedBudget && Number(savedBudget) > 0) setBudgetLimitGbp(Number(savedBudget));
      const savedRate = localStorage.getItem(RATE_KEY);
      if (savedRate && Number(savedRate) > 0) {
        setExchangeRate(Number(savedRate));
        setIsCustomRate(true);
      }
    } catch (error) {
      console.error('Local data could not be loaded:', error);
    } finally {
      setHydrated(true);
    }
    void refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    if (isCustomRate) { setIsLoadingRate(false); return; }
    let cancelled = false;
    async function loadRate() {
      setIsLoadingRate(true);
      try {
        const response = await fetch('/api/exchange-rate', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Kur alınamadı.');
        if (!cancelled) {
          setExchangeRate(Number(data.rate));
          setExchangeRateMeta(data);
        }
      } catch (error) {
        console.warn('Live rate could not be loaded:', error);
      } finally {
        if (!cancelled) setIsLoadingRate(false);
      }
    }
    void loadRate();
    return () => { cancelled = true; };
  }, [isCustomRate]);

  useEffect(() => {
    if (!serverGames.length) return;
    const currentById = new Map(serverGames.map((game) => [game.id, game]));
    setBasket((previous) => previous.map((item) => {
      const current = currentById.get(item.game.id);
      return current ? { ...item, game: current } : item;
    }));
  }, [serverGames]);

  useEffect(() => { if (hydrated) localStorage.setItem(BASKET_KEY, JSON.stringify(basket)); }, [basket, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customGames)); }, [customGames, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(BUDGET_KEY, String(budgetLimitGbp)); }, [budgetLimitGbp, hydrated]);

  const setCustomExchangeRate = (rate: number | null) => {
    if (rate === null || !Number.isFinite(rate) || rate <= 0) {
      setIsCustomRate(false);
      localStorage.removeItem(RATE_KEY);
      return;
    }
    setIsCustomRate(true);
    setExchangeRate(rate);
    localStorage.setItem(RATE_KEY, String(rate));
  };

  const addToBasket = (game: GameItem, priority: PriorityLevel = 'must_buy',
    targetStore = 'CeX London - Tottenham Court Road (Flagship)', userNotes = '') => {
    setBasket((previous) => {
      const existing = previous.find((item) => item.game.id === game.id);
      if (existing) return previous.map((item) => item.game.id === game.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...previous, { game, addedAt: new Date().toISOString(), priority, targetStore, userNotes, purchased: false, quantity: 1 }];
    });
  };
  const removeFromBasket = (gameId: string) => setBasket((items) => items.filter((item) => item.game.id !== gameId));
  const updateBasketPriority = (gameId: string, priority: PriorityLevel) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, priority } : item));
  const updateBasketStore = (gameId: string, targetStore: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, targetStore } : item));
  const updateBasketNotes = (gameId: string, userNotes: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, userNotes } : item));
  const togglePurchased = (gameId: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, purchased: !item.purchased } : item));
  const clearBasket = () => setBasket([]);

  const addCustomGame = (newGame: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => {
    const today = new Date().toISOString().slice(0, 10);
    setCustomGames((items) => [{ ...newGame, id: `CUSTOM-${Date.now()}`, lastUpdated: today,
      priceHistory: [{ date: today, price: newGame.sellPrice }] }, ...items]);
  };
  const updateGamePrice = (gameId: string, newPrice: number) => {
    if (!gameId.startsWith('CUSTOM-')) return;
    const today = new Date().toISOString().slice(0, 10);
    setCustomGames((items) => items.map((game) => {
      if (game.id !== gameId) return game;
      const history: PriceHistoryEntry[] = [...game.priceHistory];
      const last = history.at(-1);
      if (last?.date === today) last.price = newPrice;
      else history.push({ date: today, price: newPrice });
      return { ...game, originalPrice: game.sellPrice, sellPrice: newPrice, lastUpdated: today, priceHistory: history };
    }));
  };
  const resetToDefaultGames = () => { setCustomGames([]); localStorage.removeItem(CUSTOM_GAMES_KEY); };

  const totalBasketGbp = basket.reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const totalBasketTry = totalBasketGbp * exchangeRate;
  const purchasedBasketGbp = basket.filter((item) => item.purchased).reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const remainingBudgetGbp = Math.max(0, budgetLimitGbp - totalBasketGbp);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  return <AppContext.Provider value={{ games, basket, exchangeRate, exchangeRateMeta, isCustomRate, budgetLimitGbp,
    selectedPlatform, searchQuery, sortBy, maxPriceFilter, onlyInStock, onlyPriceDrops, isLoadingRate,
    isLoadingGames, catalogError, catalogMeta, refreshCatalog, setSelectedPlatform, setSearchQuery, setSortBy,
    setMaxPriceFilter, setOnlyInStock, setOnlyPriceDrops, setBudgetLimitGbp, setCustomExchangeRate,
    addToBasket, removeFromBasket, updateBasketPriority, updateBasketStore, updateBasketNotes, togglePurchased,
    clearBasket, addCustomGame, updateGamePrice, resetToDefaultGames, totalBasketGbp, totalBasketTry,
    purchasedBasketGbp, remainingBudgetGbp, basketCount }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
