export type Platform = 'PS5' | 'PS4' | 'XBOX_SX' | 'XBOX_ONE' | 'XBOX_360';
export type PriorityLevel = 'must_buy' | 'high' | 'nice_to_have' | 'backup';

export interface PriceHistoryEntry {
  date: string;
  price: number;
  cashPrice?: number;
  exchangePrice?: number;
  inStock?: boolean;
  stockCount?: number;
}

export interface GameItem {
  id: string;
  title: string;
  platform: Platform;
  categoryName: string;
  sellPrice: number;
  originalPrice?: number;
  cashPrice?: number;
  exchangePrice?: number;
  imageUrl: string;
  inStock: boolean;
  stockCount?: number;
  condition?: 'Mint' | 'Boxed' | 'Unboxed' | 'Standard';
  rating?: number;
  releaseYear?: number;
  genre?: string;
  cexUrl?: string;
  priceHistory: PriceHistoryEntry[];
  lastUpdated: string;
  popular?: boolean;
}

export interface BasketItem {
  game: GameItem;
  addedAt: string;
  priority: PriorityLevel;
  targetStore?: string;
  userNotes?: string;
  purchased: boolean;
  quantity: number;
}

export interface TravelBudget {
  limitGbp: number;
  customTryRate?: number;
}

export interface StoreLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  region: string;
  isPopularTravelSpot?: boolean;
}

export interface CatalogMeta {
  total: number;
  countsByPlatform: Partial<Record<Platform, number>>;
  lastSuccessfulSyncAt: string | null;
}

export interface ExchangeRateSnapshot {
  rate: number;
  base: string;
  target: string;
  source: string;
  sourceDate: string;
  fetchedAt: string;
  isStale: boolean;
}

export interface SyncRunSummary {
  id: string;
  externalRunId: string | null;
  trigger: 'schedule' | 'manual' | 'local';
  status: 'queued' | 'running' | 'succeeded' | 'partial' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  platformCounts: Record<string, number>;
  gamesSeen: number;
  gamesChanged: number;
  exchangeRateUpdated: boolean;
  errorSummary: string | null;
}
