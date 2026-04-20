'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CityResult } from '@/lib/types';

interface Props {
  onSelect: (city: CityResult) => void;
  selected: CityResult | null;
}

export default function CitySearch({ onSelect, selected }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(city: CityResult) {
    onSelect(city);
    setQuery(city.displayName);
    setOpen(false);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search any city in the world…"
          className="w-full pl-11 pr-10 py-3.5 text-sm"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 3, color: 'var(--text)' }}
          autoComplete="off"
        />
        {(query || selected) && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 overflow-hidden shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 3 }}>
          {results.map((city) => (
            <li key={city.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:opacity-70 transition-opacity" onClick={() => handleSelect(city)}>
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-playfair)' }}>{city.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{city.displayName}</p>
                </div>
                <span className="label-upper">{city.countryCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 px-4 py-3 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 3, color: 'var(--text-muted)' }}>
          No cities found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
