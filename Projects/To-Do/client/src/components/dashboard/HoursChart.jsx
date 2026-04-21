import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

const PERIODS = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const CHART_H = 140;
const BAR_GAP = 3;

export default function HoursChart() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.timeLogs.summary(period)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const maxHours = data
    ? Math.max(1, ...data.labels.map((_, i) => data.people.reduce((s, p) => s + (p.data[i] ?? 0), 0)))
    : 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Hours Logged</h2>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-36 text-slate-700 text-sm">Loading…</div>
      )}

      {!loading && (!data || data.people.length === 0) && (
        <div className="flex items-center justify-center h-36 text-slate-700 text-sm">No time logs yet</div>
      )}

      {!loading && data && data.people.length > 0 && (() => {
        const numBuckets = data.labels.length;
        const numPeople  = data.people.length;
        const barW       = Math.max(6, Math.floor((460 - numBuckets * BAR_GAP) / (numBuckets * numPeople)));
        const groupW     = barW * numPeople + BAR_GAP;

        return (
          <>
            <svg viewBox={`0 0 ${numBuckets * groupW + 40} ${CHART_H + 24}`} className="w-full overflow-visible">
              {/* Y gridlines */}
              {[0.25, 0.5, 0.75, 1].map(frac => {
                const y = CHART_H - frac * CHART_H;
                return (
                  <g key={frac}>
                    <line x1="36" y1={y} x2={numBuckets * groupW + 40} y2={y} stroke="#1e293b" strokeWidth="1" />
                    <text x="32" y={y + 4} textAnchor="end" className="fill-slate-700" style={{ fontSize: 8 }}>
                      {Math.round(maxHours * frac)}h
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.labels.map((label, i) => {
                const gx = 40 + i * groupW;
                let stackY = CHART_H;

                return (
                  <g key={i}>
                    {data.people.map((person, pi) => {
                      const hrs  = person.data[i] ?? 0;
                      const barH = Math.max(0, (hrs / maxHours) * CHART_H);
                      const x    = gx + pi * barW;
                      const y    = CHART_H - barH;
                      return (
                        <g key={pi}>
                          <rect
                            x={x} y={y} width={barW - 1} height={barH}
                            fill={person.color} rx="1" opacity="0.85"
                          />
                          {hrs > 0 && barH > 14 && (
                            <text x={x + barW / 2} y={y + 10} textAnchor="middle" className="fill-white" style={{ fontSize: 7 }}>
                              {hrs}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* X label */}
                    <text
                      x={gx + (groupW - BAR_GAP) / 2} y={CHART_H + 14}
                      textAnchor="middle" className="fill-slate-600" style={{ fontSize: 8 }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2">
              {data.people.map(p => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-slate-400">{p.name}</span>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
