import { GameItem, StoreLocation } from '@/types/game';
// The production catalog is loaded from Neon through /api/games.
// Keep this empty so a failed database request never displays stale or fabricated prices.
export const INITIAL_GAMES: GameItem[] = [];

export const POPULAR_UK_CEX_STORES: StoreLocation[] = [
  {
    id: 'london-tottenham-court-rd',
    name: 'CeX London - Tottenham Court Road (Flagship)',
    city: 'London',
    address: '32 Rathbone Place / Tottenham Court Rd, London W1T 1JJ',
    region: 'Central London',
    isPopularTravelSpot: true,
  },
  {
    id: 'london-oxford-street',
    name: 'CeX London - Oxford Street',
    city: 'London',
    address: '533 Oxford St, London W1C 2QN',
    region: 'Central London',
    isPopularTravelSpot: true,
  },
  {
    id: 'london-camden',
    name: 'CeX London - Camden Town',
    city: 'London',
    address: '228 Camden High St, London NW1 8QR',
    region: 'North London',
    isPopularTravelSpot: true,
  },
  {
    id: 'london-stratford',
    name: 'CeX London - Stratford Westfield',
    city: 'London',
    address: 'Westfield Stratford City, London E20 1EH',
    region: 'East London',
    isPopularTravelSpot: true,
  },
  {
    id: 'manchester-arndale',
    name: 'CeX Manchester - Arndale Centre',
    city: 'Manchester',
    address: 'Market St, Manchester M4 3AQ',
    region: 'Greater Manchester',
    isPopularTravelSpot: true,
  },
  {
    id: 'birmingham-bullring',
    name: 'CeX Birmingham - Bullring',
    city: 'Birmingham',
    address: 'Bullring & Grand Central, Birmingham B5 4BU',
    region: 'West Midlands',
    isPopularTravelSpot: true,
  },
  {
    id: 'edinburgh-princes-st',
    name: 'CeX Edinburgh - Princes Street Area',
    city: 'Edinburgh',
    address: 'Rose St / Princes St, Edinburgh EH2 2NL',
    region: 'Scotland',
    isPopularTravelSpot: true,
  },
];
