'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AvailabilityFilter, BasketItem, CatalogMeta, ExchangeRateSnapshot, GameItem, Platform, PriceHistoryEntry, PriorityLevel, SortBy, UserCollection, UserCollectionDraft } from '@/types/game';

interface AppContextType {
  games: GameItem[]; basket: BasketItem[]; exchangeRate: number; exchangeRateMeta: ExchangeRateSnapshot | null;
  isCustomRate: boolean; budgetLimitGbp: number; selectedPlatform: 'ALL' | Platform; searchQuery: string;
  sortBy: SortBy; minPriceFilter: number | null; maxPriceFilter: number | null;
  availabilityFilters: AvailabilityFilter[]; storeFilters: string[]; categoryFilters: string[]; ageRatingFilters: string[];
  conditionFilters: string[]; developerFilters: string[]; genreFilters: string[]; onlyPriceDrops: boolean;
  isLoadingRate: boolean; isLoadingGames: boolean; isLoadingMore: boolean; hasMoreGames: boolean; catalogError: string | null; catalogMeta: CatalogMeta;
  isSyncing: boolean; syncError: string | null; refreshCatalog: () => Promise<void>; loadMoreGames: () => Promise<void>;
  setSelectedPlatform: (p: 'ALL' | Platform) => void; setSearchQuery: (q: string) => void;
  setSortBy: (s: SortBy) => void; setMinPriceFilter: (p: number | null) => void; setMaxPriceFilter: (p: number | null) => void;
  setAvailabilityFilters: (v: AvailabilityFilter[]) => void; setStoreFilters: (v: string[]) => void; setCategoryFilters: (v: string[]) => void;
  setAgeRatingFilters: (v: string[]) => void; setConditionFilters: (v: string[]) => void; setDeveloperFilters: (v: string[]) => void; setGenreFilters: (v: string[]) => void;
  setOnlyPriceDrops: (v: boolean) => void; clearCatalogFilters: () => void; setBudgetLimitGbp: (limit: number) => void;
  setCustomExchangeRate: (rate: number | null) => void; addToBasket: (game: GameItem, priority?: PriorityLevel, targetStore?: string, userNotes?: string) => void;
  removeFromBasket: (gameId: string) => void; updateBasketPriority: (gameId: string, priority: PriorityLevel) => void;
  updateBasketStore: (gameId: string, targetStore: string) => void; updateBasketNotes: (gameId: string, notes: string) => void;
  togglePurchased: (gameId: string) => void; clearBasket: () => void; addCustomGame: (game: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => void;
  updateGamePrice: (gameId: string, newPrice: number) => void; resetToDefaultGames: () => void;
  totalBasketGbp: number; totalBasketTry: number; purchasedBasketGbp: number; remainingBudgetGbp: number; basketCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const BASKET_KEY = 'cex_travel_basket_v1';
const LEGACY_GAMES_KEY = 'cex_custom_games_v1';
const CUSTOM_GAMES_KEY = 'cex_custom_games_v2';
const BUDGET_KEY = 'cex_travel_budget_v1';
const RATE_KEY = 'cex_custom_rate_v1';
const PENDING_SYNC_KEY = 'cex_cloud_pending_sync_v1';
const EMPTY_META: CatalogMeta = { total: 0, countsByPlatform: {}, lastSuccessfulSyncAt: null, facets: { availability: [], stores: [], categories: [], ageRatings: [], conditions: [], developers: [], genres: [] } };
const PAGE_SIZE = 48;

function readLocalDraft(): UserCollectionDraft {
  try {
    const basket = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]') as BasketItem[];
    const customGames = JSON.parse(localStorage.getItem(CUSTOM_GAMES_KEY) || localStorage.getItem(LEGACY_GAMES_KEY) || '[]') as GameItem[];
    const budget = Number(localStorage.getItem(BUDGET_KEY));
    const rate = Number(localStorage.getItem(RATE_KEY));
    return { basket: Array.isArray(basket) ? basket : [], customGames: Array.isArray(customGames) ? customGames.filter((game) => game.id?.startsWith('CUSTOM-')) : [], budgetLimitGbp: Number.isFinite(budget) && budget > 0 ? budget : 300, customExchangeRate: Number.isFinite(rate) && rate > 0 ? rate : null };
  } catch { return { basket: [], customGames: [], budgetLimitGbp: 300, customExchangeRate: null }; }
}

function signature(draft: UserCollectionDraft) { return JSON.stringify(draft); }

export function AppProvider({ children, userId = null, authLoaded = true }: { children: React.ReactNode; userId?: string | null; authLoaded?: boolean }) {
  const [serverGames, setServerGames] = useState<GameItem[]>([]);
  const [customGames, setCustomGames] = useState<GameItem[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [exchangeRateMeta, setExchangeRateMeta] = useState<ExchangeRateSnapshot | null>(null);
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [budgetLimitGbp, setBudgetLimitGbp] = useState(300);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta>(EMPTY_META);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | Platform>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [minPriceFilter, setMinPriceFilter] = useState<number | null>(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  const [availabilityFilters, setAvailabilityFilters] = useState<AvailabilityFilter[]>([]);
  const [storeFilters, setStoreFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [ageRatingFilters, setAgeRatingFilters] = useState<string[]>([]);
  const [conditionFilters, setConditionFilters] = useState<string[]>([]);
  const [developerFilters, setDeveloperFilters] = useState<string[]>([]);
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [onlyPriceDrops, setOnlyPriceDrops] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const [syncReady, setSyncReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const catalogAbort = useRef<AbortController | null>(null);
  const lastSyncedSignature = useRef('');

  const games = useMemo(() => [...customGames, ...serverGames], [customGames, serverGames]);
  const hasMoreGames = serverGames.length < catalogMeta.total;
  const buildParams = useCallback((page: number, includeMeta: boolean) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort: sortBy });
    if (selectedPlatform !== 'ALL') params.set('platform', selectedPlatform);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (minPriceFilter !== null) params.set('minPrice', String(minPriceFilter));
    if (maxPriceFilter !== null) params.set('maxPrice', String(maxPriceFilter));
    availabilityFilters.forEach((value) => params.append('availability', value));
    storeFilters.forEach((value) => params.append('store', value));
    categoryFilters.forEach((value) => params.append('category', value));
    ageRatingFilters.forEach((value) => params.append('ageRating', value));
    conditionFilters.forEach((value) => params.append('condition', value));
    developerFilters.forEach((value) => params.append('developer', value));
    genreFilters.forEach((value) => params.append('genre', value));
    if (onlyPriceDrops) params.set('priceDrops', 'true');
    if (includeMeta) params.set('includeMeta', 'true');
    return params;
  }, [ageRatingFilters, availabilityFilters, categoryFilters, conditionFilters, developerFilters, genreFilters, maxPriceFilter, minPriceFilter, onlyPriceDrops, searchQuery, selectedPlatform, sortBy, storeFilters]);

  const requestPage = useCallback(async (page: number, replace: boolean, includeMeta: boolean, signal?: AbortSignal) => {
    const response = await fetch(`/api/games?${buildParams(page, includeMeta)}`, { signal });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Katalog alınamadı.');
    const next = data.games as GameItem[];
    setServerGames((current) => replace ? next : [...current, ...next.filter((game) => !current.some((item) => item.id === game.id))]);
    setCatalogMeta((current) => ({ total: Number(data.total || 0), countsByPlatform: includeMeta ? (data.countsByPlatform || {}) : current.countsByPlatform, lastSuccessfulSyncAt: includeMeta ? (data.lastSuccessfulSyncAt || null) : current.lastSuccessfulSyncAt, facets: includeMeta ? (data.facets || EMPTY_META.facets) : current.facets }));
  }, [buildParams]);

  const refreshCatalog = useCallback(async () => {
    catalogAbort.current?.abort();
    const controller = new AbortController();
    catalogAbort.current = controller;
    setIsLoadingGames(true); setCatalogError(null);
    try { await requestPage(1, true, true, controller.signal); }
    catch (error) { if ((error as Error).name !== 'AbortError') setCatalogError(error instanceof Error ? error.message : 'Katalog alınamadı.'); }
    finally { if (!controller.signal.aborted) setIsLoadingGames(false); }
  }, [requestPage]);

  const loadMoreGames = useCallback(async () => {
    if (isLoadingMore || !hasMoreGames) return;
    setIsLoadingMore(true);
    try { await requestPage(Math.floor(serverGames.length / PAGE_SIZE) + 1, false, false); }
    catch (error) { setCatalogError(error instanceof Error ? error.message : 'Sonraki katalog sayfası alınamadı.'); }
    finally { setIsLoadingMore(false); }
  }, [hasMoreGames, isLoadingMore, requestPage, serverGames.length]);

  useEffect(() => {
    const local = readLocalDraft();
    setBasket(local.basket); setCustomGames(local.customGames); setBudgetLimitGbp(local.budgetLimitGbp);
    if (local.customExchangeRate) { setExchangeRate(local.customExchangeRate); setIsCustomRate(true); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void refreshCatalog(); }, searchQuery ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, refreshCatalog, searchQuery]);
  useEffect(() => () => catalogAbort.current?.abort(), []);

  useEffect(() => {
    if (isCustomRate) { setIsLoadingRate(false); return; }
    let cancelled = false;
    async function loadRate() {
      setIsLoadingRate(true);
      try {
        const response = await fetch('/api/exchange-rate', { cache: 'no-store' }); const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Kur alınamadı.');
        if (!cancelled) { setExchangeRate(Number(data.rate)); setExchangeRateMeta(data); }
      } catch (error) { console.warn('Live rate could not be loaded:', error); }
      finally { if (!cancelled) setIsLoadingRate(false); }
    }
    void loadRate(); return () => { cancelled = true; };
  }, [isCustomRate]);

  const applyCollection = useCallback((collection: UserCollection) => {
    setBasket(collection.basket); setCustomGames(collection.customGames); setBudgetLimitGbp(collection.budgetLimitGbp);
    if (collection.customExchangeRate) { setExchangeRate(collection.customExchangeRate); setIsCustomRate(true); } else setIsCustomRate(false);
    setSyncRevision(collection.revision); lastSyncedSignature.current = signature(collection);
  }, []);

  useEffect(() => {
    if (!hydrated || !authLoaded) return;
    if (!userId) { setSyncReady(false); setSyncError(null); return; }
    let cancelled = false;
    async function loadCloud() {
      setSyncReady(false); setIsSyncing(true);
      try {
        const response = await fetch('/api/me/collection', { cache: 'no-store' }); const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Hesap verileri alınamadı.');
        if (!data.exists) {
          const migration = await fetch('/api/me/collection/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection: readLocalDraft() }) });
          const migrated = await migration.json();
          if (!migration.ok || !migrated.success) throw new Error(migrated.error || 'Yerel veriler taşınamadı.');
          if (!cancelled) applyCollection(migrated.collection as UserCollection);
        } else if (localStorage.getItem(PENDING_SYNC_KEY) === 'true') {
          const local = readLocalDraft();
          const saved = await fetch('/api/me/collection', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection: local, expectedRevision: data.collection.revision }) });
          const savedData = await saved.json();
          if (!saved.ok || !savedData.success) throw new Error(savedData.error || 'Bekleyen değişiklikler kaydedilemedi.');
          localStorage.removeItem(PENDING_SYNC_KEY);
          if (!cancelled) applyCollection(savedData.collection as UserCollection);
        } else if (!cancelled) applyCollection(data.collection as UserCollection);
        if (!cancelled) { setSyncReady(true); setSyncError(null); }
      } catch (error) { if (!cancelled) setSyncError(error instanceof Error ? error.message : 'Hesap verileri eşitlenemedi.'); }
      finally { if (!cancelled) setIsSyncing(false); }
    }
    void loadCloud(); return () => { cancelled = true; };
  }, [applyCollection, authLoaded, hydrated, userId]);

  const draft = useMemo<UserCollectionDraft>(() => ({ basket, customGames, budgetLimitGbp, customExchangeRate: isCustomRate ? exchangeRate : null }), [basket, budgetLimitGbp, customGames, exchangeRate, isCustomRate]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(BASKET_KEY, JSON.stringify(basket)); localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customGames)); localStorage.setItem(BUDGET_KEY, String(budgetLimitGbp));
    if (isCustomRate) localStorage.setItem(RATE_KEY, String(exchangeRate)); else localStorage.removeItem(RATE_KEY);
  }, [basket, budgetLimitGbp, customGames, exchangeRate, hydrated, isCustomRate]);

  useEffect(() => {
    if (!userId || !syncReady || !hydrated) return;
    const currentSignature = signature(draft);
    if (currentSignature === lastSyncedSignature.current) return;
    localStorage.setItem(PENDING_SYNC_KEY, 'true');
    const timer = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const send = (expectedRevision: number) => fetch('/api/me/collection', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection: draft, expectedRevision }) });
        let response = await send(syncRevision); let data = await response.json();
        if (response.status === 409 && data.collection?.revision) { response = await send(data.collection.revision); data = await response.json(); }
        if (!response.ok || !data.success) throw new Error(data.error || 'Hesap verileri kaydedilemedi.');
        setSyncRevision((data.collection as UserCollection).revision); lastSyncedSignature.current = currentSignature; localStorage.removeItem(PENDING_SYNC_KEY); setSyncError(null);
      } catch (error) { setSyncError(error instanceof Error ? error.message : 'Hesap verileri kaydedilemedi.'); }
      finally { setIsSyncing(false); }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated, syncReady, syncRevision, userId]);

  const setCustomExchangeRate = (rate: number | null) => {
    if (rate === null || !Number.isFinite(rate) || rate <= 0) { setIsCustomRate(false); return; }
    setIsCustomRate(true); setExchangeRate(rate);
  };
  const addToBasket = (game: GameItem, priority: PriorityLevel = 'must_buy', targetStore = 'CeX London - Tottenham Court Road (Flagship)', userNotes = '') => setBasket((previous) => {
    const existing = previous.find((item) => item.game.id === game.id);
    return existing ? previous.map((item) => item.game.id === game.id ? { ...item, quantity: item.quantity + 1 } : item) : [...previous, { game, addedAt: new Date().toISOString(), priority, targetStore, userNotes, purchased: false, quantity: 1 }];
  });
  const removeFromBasket = (gameId: string) => setBasket((items) => items.filter((item) => item.game.id !== gameId));
  const updateBasketPriority = (gameId: string, priority: PriorityLevel) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, priority } : item));
  const updateBasketStore = (gameId: string, targetStore: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, targetStore } : item));
  const updateBasketNotes = (gameId: string, userNotes: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, userNotes } : item));
  const togglePurchased = (gameId: string) => setBasket((items) => items.map((item) => item.game.id === gameId ? { ...item, purchased: !item.purchased } : item));
  const clearBasket = () => setBasket([]);
  const addCustomGame = (newGame: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => {
    const today = new Date().toISOString().slice(0, 10);
    setCustomGames((items) => [{ ...newGame, id: `CUSTOM-${Date.now()}`, lastUpdated: today, priceHistory: [{ date: today, price: newGame.sellPrice }] }, ...items]);
  };
  const updateGamePrice = (gameId: string, newPrice: number) => {
    if (!gameId.startsWith('CUSTOM-')) return;
    const today = new Date().toISOString().slice(0, 10);
    setCustomGames((items) => items.map((item) => {
      if (item.id !== gameId) return item;
      const history: PriceHistoryEntry[] = [...item.priceHistory]; const last = history.at(-1);
      if (last?.date === today) last.price = newPrice; else history.push({ date: today, price: newPrice });
      return { ...item, originalPrice: item.sellPrice, sellPrice: newPrice, lastUpdated: today, priceHistory: history };
    }));
  };
  const resetToDefaultGames = () => setCustomGames([]);
  const clearCatalogFilters = () => {
    setSelectedPlatform('ALL'); setMinPriceFilter(null); setMaxPriceFilter(null); setAvailabilityFilters([]);
    setStoreFilters([]); setCategoryFilters([]); setAgeRatingFilters([]); setConditionFilters([]);
    setDeveloperFilters([]); setGenreFilters([]); setOnlyPriceDrops(false);
  };
  const totalBasketGbp = basket.reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const totalBasketTry = totalBasketGbp * exchangeRate;
  const purchasedBasketGbp = basket.filter((item) => item.purchased).reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const remainingBudgetGbp = Math.max(0, budgetLimitGbp - totalBasketGbp);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  return <AppContext.Provider value={{ games, basket, exchangeRate, exchangeRateMeta, isCustomRate, budgetLimitGbp, selectedPlatform, searchQuery, sortBy, minPriceFilter, maxPriceFilter, availabilityFilters, storeFilters, categoryFilters, ageRatingFilters, conditionFilters, developerFilters, genreFilters, onlyPriceDrops, isLoadingRate, isLoadingGames, isLoadingMore, hasMoreGames, catalogError, catalogMeta, isSyncing, syncError, refreshCatalog, loadMoreGames, setSelectedPlatform, setSearchQuery, setSortBy, setMinPriceFilter, setMaxPriceFilter, setAvailabilityFilters, setStoreFilters, setCategoryFilters, setAgeRatingFilters, setConditionFilters, setDeveloperFilters, setGenreFilters, setOnlyPriceDrops, clearCatalogFilters, setBudgetLimitGbp, setCustomExchangeRate, addToBasket, removeFromBasket, updateBasketPriority, updateBasketStore, updateBasketNotes, togglePurchased, clearBasket, addCustomGame, updateGamePrice, resetToDefaultGames, totalBasketGbp, totalBasketTry, purchasedBasketGbp, remainingBudgetGbp, basketCount }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
