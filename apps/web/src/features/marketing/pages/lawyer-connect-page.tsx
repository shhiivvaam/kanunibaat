'use client';

import { Calendar, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { useOpenAuth } from '@/features/marketing/open-auth-context';

const LAWYERS = [
  {
    id: 1,
    name: 'Adv. Priya Nair',
    specialization: 'Family Law',
    city: 'Mumbai',
    rating: 4.9,
    reviews: 142,
    fee: 800,
    languages: ['English', 'Hindi', 'Marathi'],
    budget: 'mid',
    avatar: 'https://images.unsplash.com/photo-1659353219808-39d96fb9dc91?w=100&h=100&fit=crop&auto=format',
    experience: '12 years',
    online: true,
  },
  {
    id: 2,
    name: 'Adv. Rajan Krishnamurthy',
    specialization: 'Property Law',
    city: 'Bengaluru',
    rating: 4.8,
    reviews: 98,
    fee: 1200,
    languages: ['English', 'Kannada', 'Tamil'],
    budget: 'high',
    avatar: 'https://images.unsplash.com/photo-1649433658557-54cf58577c68?w=100&h=100&fit=crop&auto=format',
    experience: '18 years',
    online: false,
  },
  {
    id: 3,
    name: 'Adv. Sunita Agarwal',
    specialization: 'Consumer Rights',
    city: 'Delhi',
    rating: 4.7,
    reviews: 207,
    fee: 500,
    languages: ['Hindi', 'English'],
    budget: 'low',
    avatar: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?w=100&h=100&fit=crop&auto=format',
    experience: '8 years',
    online: true,
  },
  {
    id: 4,
    name: 'Adv. Mohammed Farooq',
    specialization: 'Employment Law',
    city: 'Hyderabad',
    rating: 4.9,
    reviews: 183,
    fee: 700,
    languages: ['English', 'Urdu', 'Telugu'],
    budget: 'mid',
    avatar: 'https://images.unsplash.com/photo-1764084051438-369ad6a09334?w=100&h=100&fit=crop&auto=format',
    experience: '14 years',
    online: true,
  },
  {
    id: 5,
    name: 'Adv. Deepa Menon',
    specialization: 'Criminal Law',
    city: 'Kochi',
    rating: 4.6,
    reviews: 76,
    fee: 1000,
    languages: ['Malayalam', 'English', 'Hindi'],
    budget: 'high',
    avatar: 'https://images.unsplash.com/photo-1659353219808-39d96fb9dc91?w=120&h=120&fit=crop&auto=format',
    experience: '22 years',
    online: false,
  },
  {
    id: 6,
    name: 'Adv. Vikram Singh',
    specialization: 'Startup / Business',
    city: 'Pune',
    rating: 4.8,
    reviews: 154,
    fee: 1500,
    languages: ['English', 'Hindi', 'Marathi'],
    budget: 'high',
    avatar: 'https://images.unsplash.com/photo-1649433658557-54cf58577c68?w=120&h=120&fit=crop&auto=format',
    experience: '10 years',
    online: true,
  },
];

const SPECIALIZATIONS = [
  'All',
  'Family Law',
  'Property Law',
  'Consumer Rights',
  'Employment Law',
  'Criminal Law',
  'Startup / Business',
];
const CITIES = ['All', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Kochi', 'Pune'];
const BUDGETS = [
  { value: 'all', label: 'Any Budget' },
  { value: 'low', label: 'Under ₹600' },
  { value: 'mid', label: '₹600–₹1,000' },
  { value: 'high', label: '₹1,000+' },
];

export function LawyerConnectPage() {
  const openAuth = useOpenAuth();
  const [filters, setFilters] = useState({ spec: 'All', city: 'All', budget: 'all', query: '' });
  const [sort, setSort] = useState<'rating' | 'price' | 'relevance'>('rating');
  const [activeChips, setActiveChips] = useState<string[]>([]);

  const addChip = (key: string, value: string) => {
    if (value === 'All' || value === 'all') return;
    const chip = `${key}:${value}`;
    if (!activeChips.includes(chip)) setActiveChips([...activeChips, chip]);
  };

  const removeChip = (chip: string) => {
    const [key] = chip.split(':');
    setActiveChips(activeChips.filter((c) => c !== chip));
    setFilters({
      ...filters,
      ...(key === 'spec' ? { spec: 'All' } : {}),
      ...(key === 'city' ? { city: 'All' } : {}),
      ...(key === 'budget' ? { budget: 'all' } : {}),
    });
  };

  const filtered = LAWYERS.filter((l) => {
    if (filters.spec !== 'All' && l.specialization !== filters.spec) return false;
    if (filters.city !== 'All' && l.city !== filters.city) return false;
    if (filters.budget !== 'all' && l.budget !== filters.budget) return false;
    if (
      filters.query &&
      !l.name.toLowerCase().includes(filters.query.toLowerCase()) &&
      !l.specialization.toLowerCase().includes(filters.query.toLowerCase())
    )
      return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'price') return a.fee - b.fee;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="border-b border-[#E7E5E4] bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center gap-2 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            <span>Home</span>
            <span>/</span>
            <span className="text-[#C2410C]">Lawyer Connect</span>
          </div>
          <h1 className="mt-1 text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}>
            Find a Lawyer
          </h1>
          <p className="mt-1 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Verified lawyers across India — filter by specialization, city, language, and budget.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="space-y-4 rounded-[20px] border border-[#E7E5E4] bg-white p-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              placeholder="Search by name or specialization…"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="h-12 w-full rounded-[12px] border border-[#E7E5E4] bg-[#FAFAF9] pl-10 pr-4 text-sm text-[#1C1917] outline-none transition-all placeholder:text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#C2410C';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E7E5E4';
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <select
              value={filters.spec}
              onChange={(e) => {
                setFilters({ ...filters, spec: e.target.value });
                addChip('spec', e.target.value);
              }}
              className="h-10 cursor-pointer rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'Specialization' : s}
                </option>
              ))}
            </select>

            <select
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value });
                addChip('city', e.target.value);
              }}
              className="h-10 cursor-pointer rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'City' : c}
                </option>
              ))}
            </select>

            <select
              value={filters.budget}
              onChange={(e) => {
                setFilters({ ...filters, budget: e.target.value });
                addChip('budget', e.target.value);
              }}
              className="h-10 cursor-pointer rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="shrink-0 text-[#78716C]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-10 flex-1 cursor-pointer rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="price">Price ↑</option>
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1.5 rounded-full bg-[#FED7AA] px-3 py-1 text-xs text-[#C2410C]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {chip.split(':')[1]}
                  <button type="button" onClick={() => removeChip(chip)} className="hover:text-[#9a3409]" aria-label="Remove filter">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-3 mt-4 flex items-center justify-between">
          <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            {filtered.length} lawyer{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lawyer) => (
            <div
              key={lawyer.id}
              className="flex cursor-pointer flex-col gap-4 rounded-[20px] border border-[#E7E5E4] bg-white p-5 transition-all duration-150 hover:scale-[1.01] hover:border-[#C2410C] hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#E7E5E4]">
                    <Image src={lawyer.avatar} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                  {lawyer.online && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#15803D]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px' }}>
                    {lawyer.name}
                  </p>
                  <span
                    className="mt-0.5 inline-block rounded-full bg-[#FFF7ED] px-2 py-0.5 text-xs text-[#C2410C]"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                  >
                    {lawyer.specialization}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < Math.floor(lawyer.rating) ? '#C2410C' : '#E7E5E4'}
                        color={i < Math.floor(lawyer.rating) ? '#C2410C' : '#E7E5E4'}
                      />
                    ))}
                </div>
                <span className="text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  {lawyer.rating}
                </span>
                <span className="text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  ({lawyer.reviews} reviews)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {lawyer.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full border border-[#E7E5E4] bg-[#FAFAF9] px-2.5 py-0.5 text-xs text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px' }}>
                    ₹{lawyer.fee}
                  </p>
                  <p className="text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                    / 30 min consultation
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  <MapPin size={11} />
                  {lawyer.city}
                </div>
              </div>

              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-[#C2410C] text-sm text-white transition-all hover:bg-[#9a3409] active:scale-[0.97]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                <Calendar size={14} />
                Book Consultation
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#FFF7ED]">
              <Search size={28} className="text-[#C2410C]" />
            </div>
            <p className="mb-2 text-lg text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              No lawyers found
            </p>
            <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              Try adjusting your filters or search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
