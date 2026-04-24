import ResultCard from './ResultCard';

/**
 * ResultsList — renders ranked result cards or appropriate empty/loading state.
 *
 * Props:
 *  results   Array of result objects
 *  loading   boolean
 *  hasPolygon boolean
 *  onCardClick(item)
 */

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/50 p-3 animate-pulse">
            <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-700" />
                <div className="flex-1">
                    <div className="h-2.5 bg-slate-700 rounded mb-1.5 w-16" />
                    <div className="h-4 bg-slate-700 rounded w-24" />
                </div>
                <div className="w-16">
                    <div className="h-1.5 bg-slate-700 rounded" />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg bg-slate-900/60 h-10" />
                ))}
            </div>
        </div>
    );
}

export default function ResultsList({ results, loading, hasPolygon, onCardClick }) {
    /* Loading state */
    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Results
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400">
                        <span className="inline-block w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        Analyzing…
                    </span>
                </div>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    /* Results available */
    if (results.length > 0) {
        const top10 = results.slice(0, 10);
        return (
            <div className="flex flex-col gap-3">
                {/* Header with count */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Results
                    </h2>
                    <span className="text-xs text-slate-500">
                        Top {top10.length} of {results.length}
                    </span>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/40">
                    {[
                        { color: '#22c55e', label: 'High ≥ 0.7' },
                        { color: '#f97316', label: 'Med ≥ 0.4' },
                        { color: '#ef4444', label: 'Low < 0.4' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Card list */}
                <div className="flex flex-col gap-2.5">
                    {top10.map((item) => (
                        <ResultCard
                            key={item.rank}
                            item={item}
                            onClick={() => onCardClick(item)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    /* Empty state — polygon drawn but no results yet */
    if (hasPolygon) {
        return (
            <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Results
                </h2>
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center rounded-2xl border border-dashed border-slate-700">
                    <span className="text-3xl">🔍</span>
                    <p className="text-slate-400 text-sm">Click <strong className="text-indigo-400">Run Analysis</strong> to compute results.</p>
                </div>
            </div>
        );
    }

    /* Empty state — no polygon yet */
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Results
            </h2>

            {/* Legend always visible */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/40">
                {[
                    { color: '#22c55e', label: 'High ≥ 0.7' },
                    { color: '#f97316', label: 'Med ≥ 0.4' },
                    { color: '#ef4444', label: 'Low < 0.4' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-slate-400">{label}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center rounded-2xl border border-dashed border-slate-700">
                <span className="text-4xl">🗺️</span>
                <div>
                    <p className="text-slate-300 text-sm font-medium mb-1">Draw an area to start</p>
                    <p className="text-slate-500 text-xs">
                        Use the polygon tool on the map to select a region, then run the analysis.
                    </p>
                </div>
            </div>
        </div>
    );
}
