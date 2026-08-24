'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameItem, BasketItem, PriorityLevel, Platform, PriceHistoryEntry } from '@/types/game';
import { INITIAL_GAMES } from '@/data/initialGames';

interface AppContextType {
  games: GameItem[];
  basket: BasketItem[];
  exchangeRate: number; // 1 GBP in TRY
  isCustomRate: boolean;
  budgetLimitGbp: number;
  selectedPlatform: 'ALL' | Platform;
  searchQuery: string;
  sortBy: 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating';
  maxPriceFilter: number;
  onlyInStock: boolean;
  onlyPriceDrops: boolean;
  isLoadingRate: boolean;
  
  // Setters & Actions
  setSelectedPlatform: (p: 'ALL' | Platform) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating') => void;
  setMaxPriceFilter: (p: number) => void;
  setOnlyInStock: (v: boolean) => void;
  setOnlyPriceDrops: (v: boolean) => void;
  setBudgetLimitGbp: (limit: number) => void;
  setCustomExchangeRate: (rate: number | null) => void;
  
  // Basket actions
  addToBasket: (game: GameItem, priority?: PriorityLevel, targetStore?: string, userNotes?: string) => void;
  removeFromBasket: (gameId: string) => void;
  updateBasketPriority: (gameId: string, priority: PriorityLevel) => void;
  updateBasketStore: (gameId: string, targetStore: string) => void;
  updateBasketNotes: (gameId: string, notes: string) => void;
  togglePurchased: (gameId: string) => void;
  clearBasket: () => void;
  
  // Game catalog actions
  addCustomGame: (game: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => void;
  updateGamePrice: (gameId: string, newPrice: number) => void;
  resetToDefaultGames: () => void;
  
  // Computed values
  totalBasketGbp: number;
  totalBasketTry: number;
  purchasedBasketGbp: number;
  remainingBudgetGbp: number;
  basketCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_BASKET_KEY = 'cex_travel_basket_v1';
const LOCAL_STORAGE_GAMES_KEY = 'cex_custom_games_v1';
const LOCAL_STORAGE_BUDGET_KEY = 'cex_travel_budget_v1';
const LOCAL_STORAGE_RATE_KEY = 'cex_custom_rate_v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(44.80);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [budgetLimitGbp, setBudgetLimitGbp] = useState<number>(300);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | Platform>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating'>('discount');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyPriceDrops, setOnlyPriceDrops] = useState<boolean>(false);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const savedBasket = localStorage.getItem(LOCAL_STORAGE_BASKET_KEY);
      if (savedBasket) {
        setBasket(JSON.parse(savedBasket));
      }

      const savedGames = localStorage.getItem(LOCAL_STORAGE_GAMES_KEY);
      if (savedGames) {
        setGames(JSON.parse(savedGames));
      }

      const savedBudget = localStorage.getItem(LOCAL_STORAGE_BUDGET_KEY);
      if (savedBudget) {
        setBudgetLimitGbp(Number(savedBudget));
      }

      const savedRate = localStorage.getItem(LOCAL_STORAGE_RATE_KEY);
      if (savedRate) {
        setExchangeRate(Number(savedRate));
        setIsCustomRate(true);
      }
    } catch (e) {
      console.error('Failed to load from local storage', e);
    }
  }, []);

  // Fetch live exchange rate if not custom
  useEffect(() => {
    if (isCustomRate) {
      setIsLoadingRate(false);
      return;
    }

    async function fetchRate() {
      setIsLoadingRate(true);
      try {
        const res = await fetch('/api/exchange-rate');
        if (res.ok) {
          const data = await res.json();
          if (data.rate && typeof data.rate === 'number') {
            setExchangeRate(data.rate);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live rate, using fallback rate', err);
      } finally {
        setIsLoadingRate(false);
      }
    }

    fetchRate();
  }, [isCustomRate]);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BASKET_KEY, JSON.stringify(basket));
    } catch (e) {
      console.error('Failed to save basket', e);
    }
  }, [basket]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GAMES_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('Failed to save games', e);
    }
  }, [games]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUDGET_KEY, String(budgetLimitGbp));
    } catch (e) {
      console.error('Failed to save budget', e);
    }
  }, [budgetLimitGbp]);

  const setCustomExchangeRate = (rate: number | null) => {
    if (rate === null || isNaN(rate) || rate <= 0) {
      setIsCustomRate(false);
      localStorage.removeItem(LOCAL_STORAGE_RATE_KEY);
    } else {
      setIsCustomRate(true);
      setExchangeRate(rate);
      localStorage.setItem(LOCAL_STORAGE_RATE_KEY, String(rate));
    }
  };

  // Basket Actions
  const addToBasket = (
    game: GameItem,
    priority: PriorityLevel = 'must_buy',
    targetStore: string = 'CeX London - Tottenham Court Road (Flagship)',
    userNotes: string = ''
  ) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.game.id === game.id);
      if (existing) {
        return prev.map((item) =>
          item.game.id === game.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const newItem: BasketItem = {
        game,
        addedAt: new Date().toISOString(),
        priority,
        targetStore,
        userNotes,
        purchased: false,
        quantity: 1,
      };
      return [...prev, newItem];
    });
  };

  const removeFromBasket = (gameId: string) => {
    setBasket((prev) => prev.filter((item) => item.game.id !== gameId));
  };

  const updateBasketPriority = (gameId: string, priority: PriorityLevel) => {
    setBasket((prev) =>
      prev.map((item) => (item.game.id === gameId ? { ...item, priority } : item))
    );
  };

  const updateBasketStore = (gameId: string, targetStore: string) => {
    setBasket((prev) =>
      prev.map((item) => (item.game.id === gameId ? { ...item, targetStore } : item))
    );
  };

  const updateBasketNotes = (gameId: string, notes: string) => {
    setBasket((prev) =>
      prev.map((item) => (item.game.id === gameId ? { ...item, userNotes: notes } : item))
    );
  };

  const togglePurchased = (gameId: string) => {
    setBasket((prev) =>
      prev.map((item) =>
        item.game.id === gameId ? { ...item, purchased: !item.purchased } : item
      )
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  // Game Catalog Actions
  const addCustomGame = (newGameData: Omit<GameItem, 'id' | 'priceHistory' | 'lastUpdated'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newId = `CUSTOM-${Date.now()}`;
    const newGame: GameItem = {
      ...newGameData,
      id: newId,
      lastUpdated: today,
      priceHistory: [{ date: today, price: newGameData.sellPrice }],
    };
    setGames((prev) => [newGame, ...prev]);
  };

  const updateGamePrice = (gameId: string, newPrice: number) => {
    const today = new Date().toISOString().split('T')[0];
    setGames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          const oldPrice = g.sellPrice;
          const updatedHistory: PriceHistoryEntry[] = [...g.priceHistory, { date: today, price: newPrice }];
          return {
            ...g,
            originalPrice: g.originalPrice || oldPrice,
            sellPrice: newPrice,
            lastUpdated: today,
            priceHistory: updatedHistory,
          };
        }
        return g;
      })
    );
  };

  const resetToDefaultGames = () => {
    setGames(INITIAL_GAMES);
    localStorage.removeItem(LOCAL_STORAGE_GAMES_KEY);
  };

  // Calculations
  const totalBasketGbp = basket.reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const totalBasketTry = totalBasketGbp * exchangeRate;
  const purchasedBasketGbp = basket
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + item.game.sellPrice * item.quantity, 0);
  const remainingBudgetGbp = Math.max(0, budgetLimitGbp - totalBasketGbp);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        games,
        basket,
        exchangeRate,
        isCustomRate,
        budgetLimitGbp,
        selectedPlatform,
        searchQuery,
        sortBy,
        maxPriceFilter,
        onlyInStock,
        onlyPriceDrops,
        isLoadingRate,

        setSelectedPlatform,
        setSearchQuery,
        setSortBy,
        setMaxPriceFilter,
        setOnlyInStock,
        setOnlyPriceDrops,
        setBudgetLimitGbp,
        setCustomExchangeRate,

        addToBasket,
        removeFromBasket,
        updateBasketPriority,
        updateBasketStore,
        updateBasketNotes,
        togglePurchased,
        clearBasket,

        addCustomGame,
        updateGamePrice,
        resetToDefaultGames,

        totalBasketGbp,
        totalBasketTry,
        purchasedBasketGbp,
        remainingBudgetGbp,
        basketCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
