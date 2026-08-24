export type Platform = 'PS5' | 'PS4' | 'XBOX_SX' | 'XBOX_ONE' | 'XBOX_360';

export type PriorityLevel = 'must_buy' | 'high' | 'nice_to_have' | 'backup';

export interface PriceHistoryEntry {
  date: string; // YYYY-MM-DD
  price: number; // in GBP £
}

export interface GameItem {
  id: string; // e.g. "PS5-001" or CeX boxId
  title: string;
  platform: Platform;
  categoryName: string;
  sellPrice: number; // Selling price in £ GBP
  originalPrice?: number; // Previous/MSRP price in £ GBP for discount tracking
  cashPrice?: number; // CeX Buy for Cash in £ GBP
  exchangePrice?: number; // CeX Buy for Voucher in £ GBP
  imageUrl: string;
  inStock: boolean;
  stockCount?: number;
  condition?: 'Mint' | 'Boxed' | 'Unboxed' | 'Standard';
  rating?: number; // e.g. 4.8 / 5
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
  customTryRate?: number; // Override live GBP to TRY rate
}

export interface StoreLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  region: string;
  isPopularTravelSpot?: boolean;
}
