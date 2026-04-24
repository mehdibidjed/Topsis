/**
 * ResultCard — displays a single TOPSIS result.
 *
 * Props:
 *  item    { rank, score, lat, lng, wind, slope, altitude, habitations }
 *  onClick()
 */

function getScoreColor(score) {
    if (score >= 0.7) return { bg: '#16a34a', text: '#22c55e', badge: '#14532d', ring: '#22c55e' };
    if (score >= 0.4) return { bg: '#c2410c', text: '#f97316', badge: '#431407', ring: '#f97316' };
    return { bg: '#b91c1c', text: '#ef4444', badge: '#450a0a', ring: '#ef4444' };
}

function getRankStyle(rank) {
    if (rank === 1) return { bg: '#ca8a04', text: '#fef08a', label: '🥇' };
    if (rank === 2) return { bg: '#6b7280', text: '#e5e7eb', label: '🥈' };
    if (rank === 3) return { bg: '#92400e', text: '#fde68a', label: '🥉' };
    return { bg: '#1e293b', text: '#94a3b8', label: `#${rank}` };
}

const METRICS = [
    { key: 'wind', label: 'Wind', unit: 'm/s', icon: '💨' },
    { key: 'slope', label: 'Slope', unit: '°', icon: '⛰️' },
    { key: 'altitude', label: 'Alt.', unit: 'm', icon: '📡' },
    { key: 'habitations', label: 'Hab.', unit: '', icon: '🏘️' },
];

export default function ResultCard({ item, onClick }) {
    const scoreStyle = getScoreColor(item.score);
    const rankStyle = getRankStyle(item.rank);

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-slate-700/60 bg-slate-800/70 hover:bg-slate-700/80 hover:border-indigo-600/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/20 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 animate-slide-up overflow-hidden"
        >
            {/* Top bar colored by score */}
            <div className="h-1 w-full" style={{ backgroundColor: scoreStyle.text }} />

            <div className="p-3">
                {/* Header row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                    {/* Rank badge */}
                    <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold shrink-0"
                        style={{ backgroundColor: rankStyle.bg, color: rankStyle.text }}
                    >
                        {rankStyle.label}
                    </span>

                    {/* Score */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 leading-none mb-0.5">TOPSIS Score</p>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-lg font-bold tabular-nums leading-none"
                                style={{ color: scoreStyle.text }}
                            >
                                {item.score.toFixed(4)}
                            </span>
                        </div>
                    </div>

                    {/* Score bar */}
                    <div className="w-16 shrink-0">
                        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(item.score * 100).toFixed(0)}%`,
                                    backgroundColor: scoreStyle.text,
                                }}
                            />
                        </div>
                        <p className="text-right text-xs text-slate-500 mt-0.5">
                            {(item.score * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-4 gap-1.5">
                    {METRICS.map(({ key, label, unit, icon }) => (
                        <div
                            key={key}
                            className="rounded-lg bg-slate-900/60 px-2 py-1.5 text-center"
                        >
                            <p className="text-xs text-slate-500 leading-none mb-0.5">{icon} {label}</p>
                            <p className="text-xs font-semibold text-slate-200 tabular-nums leading-none">
                                {typeof item[key] === 'number'
                                    ? item[key].toFixed(1)
                                    : item[key] ?? '—'}
                                <span className="text-slate-500 font-normal">{unit}</span>
                            </p>
                        </div>
                    ))}
                </div>

                {/* Coords hint */}
                <p className="text-right text-xs text-slate-600 mt-2">
                    📍 {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}
                </p>
            </div>
        </button>
    );
}
