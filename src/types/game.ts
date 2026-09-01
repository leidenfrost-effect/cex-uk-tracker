export type Platform = 'PS5' | 'PS4' | 'XBOX_SX' | 'XBOX_ONE' | 'XBOX_360';
export type PriorityLevel = 'must_buy' | 'high' | 'nice_to_have' | 'backup';
export type AvailabilityFilter = 'store' | 'online';
export type SortBy = 'relevance' | 'popularity' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc' | 'rating';

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
  inStockStore?: boolean;
  inStockOnline?: boolean;
  stockCount?: number;
  condition?: 'Mint' | 'Boxed' | 'Unboxed' | 'Standard';
  rating?: number;
  ageRating?: string;
  releaseYear?: number;
  genre?: string;
  genres?: string[];
  developer?: string;
  stores?: string[];
  popularityScore?: number;
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
  facets: CatalogFacets;
}

export interface CatalogFacetOption {
  value: string;
  count: number;
  label?: string;
}

export interface CatalogFacets {
  availability: CatalogFacetOption[];
  stores: CatalogFacetOption[];
  categories: CatalogFacetOption[];
  ageRatings: CatalogFacetOption[];
  conditions: CatalogFacetOption[];
  developers: CatalogFacetOption[];
  genres: CatalogFacetOption[];
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

export interface UserCollection {
  basket: BasketItem[];
  customGames: GameItem[];
  budgetLimitGbp: number;
  customExchangeRate: number | null;
  revision: number;
  migratedAt: string | null;
}

export type UserCollectionDraft = Omit<UserCollection, 'revision' | 'migratedAt'>;
