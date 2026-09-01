'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AvailabilityFilter, CatalogFacetOption, Platform, SortBy } from '@/types/game';
import { ArrowUpDown, Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, Sparkles, Tag, X } from 'lucide-react';

interface FilterGroupProps {
  title: string;
  options: CatalogFacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
}

function FilterGroup({ title, options, selected, onToggle, searchable = false }: FilterGroupProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (normalized ? options.filter((option) => option.value.toLowerCase().includes(normalized)) : options).slice(0, searchable ? 80 : 20);
  }, [options, query, searchable]);

  return <section className="rounded-xl border border-zinc-800 bg-zinc-950/50">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-bold text-zinc-100"><span>{title}</span><ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
    {open && <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
      {searchable && <label className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5"><Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" /><span className="sr-only">Search {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-500" /></label>}
      <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
        {visibleOptions.length ? visibleOptions.map((option) => {
          const checked = selected.includes(option.value);
          return <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"><input type="checkbox" checked={checked} onChange={() => onToggle(option.value)} className="peer sr-only" /><span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-blue-500 bg-blue-600 text-white' : 'border-zinc-600 bg-zinc-900'}`}>{checked && <Check className="h-3 w-3" />}</span><span className="min-w-0 flex-1 truncate">{option.label || option.value}</span><span className="font-mono text-[10px] text-zinc-500">{option.count.toLocaleString('en-GB')}</span></label>;
        }) : <p className="px-1.5 py-2 text-xs text-zinc-500">No options available yet.</p>}
      </div>
      {options.length > visibleOptions.length && !query && <p className="mt-2 px-1.5 text-[10px] text-zinc-500">Use search to find more options.</p>}
    </div>}
  </section>;
}

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 10000) : null;
}

export const GameFilters: React.FC = () => {
  const {
    catalogMeta, selectedPlatform, setSelectedPlatform, sortBy, setSortBy,
    minPriceFilter, maxPriceFilter, setMinPriceFilter, setMaxPriceFilter,
    availabilityFilters, storeFilters, categoryFilters, ageRatingFilters, conditionFilters, developerFilters, genreFilters,
    setAvailabilityFilters, setStoreFilters, setCategoryFilters, setAgeRatingFilters, setConditionFilters, setDeveloperFilters, setGenreFilters,
    onlyPriceDrops, setOnlyPriceDrops, clearCatalogFilters,
  } = useApp();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const platforms: { id: 'ALL' | Platform; label: string; activeBg: string }[] = [
    { id: 'ALL', label: 'All Platforms', activeBg: 'bg-blue-600 border-blue-500 shadow-blue-600/30' },
    { id: 'PS5', label: 'PlayStation 5', activeBg: 'bg-blue-600 border-blue-500 shadow-blue-600/30' },
    { id: 'PS4', label: 'PlayStation 4', activeBg: 'bg-indigo-600 border-indigo-500 shadow-indigo-600/30' },
    { id: 'XBOX_SX', label: 'Xbox Series X/S', activeBg: 'bg-emerald-600 border-emerald-500 shadow-emerald-600/30' },
    { id: 'XBOX_ONE', label: 'Xbox One', activeBg: 'bg-green-600 border-green-500 shadow-green-600/30' },
    { id: 'XBOX_360', label: 'Xbox 360', activeBg: 'bg-lime-600 border-lime-500 shadow-lime-600/30' },
  ];

  const toggle = (values: string[], setter: (next: string[]) => void, value: string) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const toggleAvailability = (value: string) => {
    if (value === 'store' || value === 'online') toggle(availabilityFilters, (next) => setAvailabilityFilters(next as AvailabilityFilter[]), value);
  };
  const availabilityOptions = catalogMeta.facets.availability.map((option) => ({ ...option, label: option.value === 'store' ? 'In Stock In Store' : 'In Stock Online' }));
  const selectedAvailabilityLabels = availabilityFilters.map((value) => value === 'store' ? 'In Stock In Store' : 'In Stock Online');
  const selectedCount = availabilityFilters.length + storeFilters.length + categoryFilters.length + ageRatingFilters.length + conditionFilters.length + developerFilters.length + genreFilters.length + (minPriceFilter !== null || maxPriceFilter !== null ? 1 : 0) + (selectedPlatform !== 'ALL' ? 1 : 0);
  const chips = [...selectedAvailabilityLabels, ...storeFilters, ...categoryFilters, ...ageRatingFilters, ...conditionFilters, ...developerFilters, ...genreFilters];

  const filterGroups = <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <FilterGroup title="By Availability" options={availabilityOptions} selected={availabilityFilters} onToggle={toggleAvailability} />
    <FilterGroup title="Stores" options={catalogMeta.facets.stores} selected={storeFilters} onToggle={(value) => toggle(storeFilters, setStoreFilters, value)} searchable />
    <FilterGroup title="By Category" options={catalogMeta.facets.categories} selected={categoryFilters} onToggle={(value) => toggle(categoryFilters, setCategoryFilters, value)} />
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50"><div className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-zinc-100"><SlidersHorizontal className="h-4 w-4 text-blue-400" />By Price</div><div className="grid grid-cols-2 gap-2 border-t border-zinc-800 px-3 pb-3 pt-2"><label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Minimum<input type="number" min="0" step="0.01" value={minPriceFilter ?? ''} onChange={(event) => setMinPriceFilter(numberValue(event.target.value))} placeholder="£0" className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-100 outline-none focus:border-blue-500" /></label><label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Maximum<input type="number" min="0" step="0.01" value={maxPriceFilter ?? ''} onChange={(event) => setMaxPriceFilter(numberValue(event.target.value))} placeholder="No limit" className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-100 outline-none focus:border-blue-500" /></label></div></section>
    <FilterGroup title="Age Rating (BBFC)" options={catalogMeta.facets.ageRatings} selected={ageRatingFilters} onToggle={(value) => toggle(ageRatingFilters, setAgeRatingFilters, value)} />
    <FilterGroup title="Condition" options={catalogMeta.facets.conditions} selected={conditionFilters} onToggle={(value) => toggle(conditionFilters, setConditionFilters, value)} />
    <FilterGroup title="Developer" options={catalogMeta.facets.developers} selected={developerFilters} onToggle={(value) => toggle(developerFilters, setDeveloperFilters, value)} searchable />
    <FilterGroup title="Genre" options={catalogMeta.facets.genres} selected={genreFilters} onToggle={(value) => toggle(genreFilters, setGenreFilters, value)} searchable />
  </div>;

  return <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-md sm:p-4">
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">{platforms.map((platform) => { const count = platform.id === 'ALL' ? catalogMeta.total : catalogMeta.countsByPlatform[platform.id] || 0; const active = selectedPlatform === platform.id; return <button key={platform.id} type="button" onClick={() => setSelectedPlatform(platform.id)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${active ? `${platform.activeBg} text-white shadow-md` : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}`}><span>{platform.label}</span><span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${active ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{count}</span></button>; })}</div>
    <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800/80 pt-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs"><ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" /><span className="text-zinc-400">Sort by:</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="max-w-[190px] cursor-pointer bg-transparent font-medium text-zinc-100 outline-none"><option value="relevance" className="bg-zinc-900">Relevance</option><option value="popularity" className="bg-zinc-900">Popularity</option><option value="price_asc" className="bg-zinc-900">Price: Low - High</option><option value="price_desc" className="bg-zinc-900">Price: High - Low</option><option value="title_asc" className="bg-zinc-900">Product name: A - Z</option><option value="title_desc" className="bg-zinc-900">Product name: Z - A</option><option value="rating" className="bg-zinc-900">Top Rated</option></select></label><button type="button" onClick={() => setOnlyPriceDrops(!onlyPriceDrops)} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${onlyPriceDrops ? 'border-amber-500/60 bg-amber-500/20 text-amber-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'}`}><Sparkles className="h-3.5 w-3.5" />Price drops</button></div><button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/50 bg-blue-600/15 px-4 py-2 text-xs font-bold text-blue-300 lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters{selectedCount > 0 && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">{selectedCount}</span>}</button></div>
    <div className="mt-3 hidden lg:block">{filterGroups}</div>
    {chips.length > 0 || selectedCount > 0 ? <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3"><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active filters</span>{chips.slice(0, 8).map((chip, index) => <span key={`${chip}-${index}`} className="rounded-full border border-blue-500/30 bg-blue-600/10 px-2 py-1 text-[10px] text-blue-300">{chip}</span>)}{chips.length > 8 && <span className="text-[10px] text-zinc-500">+{chips.length - 8} more</span>}<button type="button" onClick={clearCatalogFilters} className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 underline hover:text-zinc-100"><RotateCcw className="h-3 w-3" />Clear all</button></div> : null}
    {mobileFiltersOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-black/70" /><div className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-zinc-700 bg-zinc-950 p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-zinc-100">Filters</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"><X className="h-5 w-5" /></button></div>{filterGroups}<button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"><Tag className="h-4 w-4" />Show results</button></div></div>}
  </section>;
};
