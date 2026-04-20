'use client';

import dynamic from 'next/dynamic';
import { ComparableMarket } from '@/lib/types';
import { getCityCoords } from '@/lib/cityCoords';

// Leaflet must be imported client-side only
const MapContainer   = dynamic(() => import('react-leaflet').then(m => m.MapContainer),   { ssr: false });
const TileLayer      = dynamic(() => import('react-leaflet').then(m => m.TileLayer),      { ssr: false });
const CircleMarker   = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),   { ssr: false });
const Popup          = dynamic(() => import('react-leaflet').then(m => m.Popup),          { ssr: false });

function healthColor(score: number): string {
  if (score >= 70) return '#2d7a4f';
  if (score >= 55) return '#b47800';
  return '#8B1C13';
}

interface Props {
  cityName:    string;
  cityLat:     number;
  cityLon:     number;
  comparables: ComparableMarket[];
}

export default function MarketMap({ cityName, cityLat, cityLon, comparables }: Props) {
  const compsWithCoords = comparables
    .map(c => ({ ...c, coords: getCityCoords(c.city) }))
    .filter(c => c.coords != null) as (ComparableMarket & { coords: [number, number] })[];

  return (
    <div className="card overflow-hidden" style={{ height: 380 }}>
      <MapContainer
        center={[cityLat, cityLon]}
        zoom={4}
        style={{ height: '100%', width: '100%', background: 'var(--bg)' }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap © Carto"
        />

        {/* Searched city — crimson */}
        <CircleMarker
          center={[cityLat, cityLon]}
          radius={12}
          pathOptions={{ color: '#8B1C13', fillColor: '#8B1C13', fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <strong style={{ color: '#8B1C13' }}>{cityName}</strong>
            <br /><span style={{ fontSize: 11 }}>Searched city</span>
          </Popup>
        </CircleMarker>

        {/* Comparable markets */}
        {compsWithCoords.map(c => (
          <CircleMarker
            key={c.city}
            center={c.coords}
            radius={8}
            pathOptions={{ color: healthColor(c.healthScore), fillColor: healthColor(c.healthScore), fillOpacity: 0.75, weight: 1.5 }}
          >
            <Popup>
              <strong>{c.city}</strong><br />
              <span style={{ fontSize: 11 }}>Health: {c.healthScore}/100 · ${c.avgPricePerSqft}/sqft · {c.yoyChange >= 0 ? '+' : ''}{c.yoyChange.toFixed(1)}% YoY</span>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        className="absolute bottom-3 right-3 z-[1000] rounded-lg px-3 py-2 flex flex-col gap-1.5"
        style={{ background: 'rgba(245,240,232,0.95)', border: '1px solid var(--border)', fontSize: 11 }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: '#8B1C13' }} />
          <span style={{ color: 'var(--text)' }}>Searched city</span>
        </div>
        {[{ color: '#2d7a4f', label: 'Strong (70+)' }, { color: '#b47800', label: 'Moderate (55–69)' }, { color: '#8B1C13', label: 'Weak (<55)' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: l.color, opacity: 0.75 }} />
            <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
