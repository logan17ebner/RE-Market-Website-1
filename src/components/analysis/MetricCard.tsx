'use client';

import { useState, useEffect, useRef } from 'react';

export type Confidence = 'live' | 'estimated' | 'calculated';

export interface SourceInfo {
  name: string;
  url?: string;
  methodology?: string;
  lastUpdated?: string;
}

interface Props {
  label: string;
  value: string | number;
  change?: number | null;
  subtext?: string;
  source?: string;
  sourceInfo?: SourceInfo;
  confidence?: Confidence;
  highlight?: boolean;
}

const CONF_STYLE: Record<Confidence, { color: string; label: string }> = {
  live:       { color: '#2d7a4f', label: 'Live'      },
  estimated:  { color: '#b47800', label: 'Estimate'  },
  calculated: { color: '#5b6abf', label: 'Calculated' },
};

export default function MetricCard({
  label, value, change, subtext, source, sourceInfo, confidence, highlight,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const conf = confidence ? CONF_STYLE[confidence] : null;

  return (
    <div
      ref={ref}
      className="card card-hover p-5 flex flex-col gap-2 relative"
      style={highlight ? { borderColor: 'var(--accent)', borderLeftWidth: 3 } : {}}
    >
      {/* Confidence dot */}
      {conf && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: conf.color }}
          title={conf.label}
        />
      )}

      <p className="label-upper pr-4">{label}</p>

      <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>
        {value}
      </p>

      {change !== undefined && change !== null && (
        <p className="text-xs font-medium" style={{ color: change >= 0 ? '#2d7a4f' : '#b91c1c' }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% YoY
        </p>
      )}

      {subtext && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}

      {/* Source row */}
      {(source || sourceInfo) && (
        <div className="flex items-center gap-1 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs flex-1 truncate" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>{source}</p>
          {sourceInfo && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs leading-none hover:opacity-70 transition-opacity"
              style={{ background: conf?.color ?? 'var(--text-muted)', color: '#fff', fontWeight: 700 }}
              aria-label="Source details"
            >
              i
            </button>
          )}
        </div>
      )}

      {/* Source popover */}
      {open && sourceInfo && (
        <div
          className="absolute z-50 rounded-xl shadow-2xl p-4 w-72"
          style={{
            bottom: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text)' }}>{sourceInfo.name}</p>
            {conf && (
              <span
                className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                style={{ background: conf.color + '18', color: conf.color }}
              >
                {conf.label}
              </span>
            )}
          </div>
          {sourceInfo.methodology && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
              {sourceInfo.methodology}
            </p>
          )}
          {sourceInfo.lastUpdated && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Last updated: <strong>{sourceInfo.lastUpdated}</strong>
            </p>
          )}
          {sourceInfo.url && (
            <a
              href={sourceInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              View source ↗
            </a>
          )}
          {/* small arrow */}
          <div
            className="absolute"
            style={{
              bottom: -6, left: 18,
              width: 10, height: 10,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderTop: 'none', borderLeft: 'none',
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      )}
    </div>
  );
}
