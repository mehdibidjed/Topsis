import { useState, useCallback } from 'react';

const WEIGHT_KEYS = ['wind', 'slope', 'habitations', 'exposure', 'altitude'];

const WEIGHT_META = {
    wind: { label: 'Wind (Vent)', icon: '💨', color: '#818cf8' },
    slope: { label: 'Slope (Pente)', icon: '⛰️', color: '#34d399' },
    habitations: { label: 'Habitations', icon: '🏘️', color: '#f87171' },
    exposure: { label: 'Exposure (Exposition)', icon: '☀️', color: '#fbbf24' },
    altitude: { label: 'Altitude', icon: '📡', color: '#60a5fa' },
};

/**
 * Normalize a weights object so all values sum to exactly 1.0.
 * Values are expected as 0–100 integers; output remains 0–100.
 */
function normalizeWeights(updated) {
    const total = Object.values(updated).reduce((s, v) => s + v, 0);
    if (total === 0) {
        // Distribute evenly
        const even = 100 / WEIGHT_KEYS.length;
        return Object.fromEntries(WEIGHT_KEYS.map((k) => [k, even]));
    }
    return Object.fromEntries(
        WEIGHT_KEYS.map((k) => [k, (updated[k] / total) * 100])
    );
}

/**
 * WeightsPanel — sliders for each criterion + Run / Reset buttons.
 *
 * Props:
 *  weights        { wind, slope, habitations, exposure, altitude }  (0–100)
 *  onWeightsChange(newWeights)
 *  onRunAnalysis()
 *  onReset()
 *  hasPolygon     boolean
 *  loading        boolean
 */
export default function WeightsPanel({
    weights,
    onWeightsChange,
    onRunAnalysis,
    onReset,
    hasPolygon,
    loading,
}) {
    const [localWeights, setLocalWeights] = useState(weights);

    const handleSliderChange = useCallback((key, rawValue) => {
        const updated = { ...localWeights, [key]: Number(rawValue) };
        const normalized = normalizeWeights(updated);
        setLocalWeights(normalized);
        onWeightsChange(
            Object.fromEntries(WEIGHT_KEYS.map((k) => [k, normalized[k] / 100]))
        );
    }, [localWeights, onWeightsChange]);

    const totalPct = Object.values(localWeights).reduce((s, v) => s + v, 0);
    const canRun = hasPolygon && !loading;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Criteria Weights
                </h2>
                <span className="text-xs text-slate-500">
                    Total: {totalPct.toFixed(0)}%
                </span>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-4">
                {WEIGHT_KEYS.map((key) => {
                    const meta = WEIGHT_META[key];
                    const pct = localWeights[key] ?? 20;

                    return (
                        <div key={key} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
                                    <span>{meta.icon}</span>
                                    {meta.label}
                                </label>
                                <span
                                    className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: `${meta.color}22`,
                                        color: meta.color,
                                    }}
                                >
                                    {pct.toFixed(1)}%
                                </span>
                            </div>

                            {/* Track with filled portion */}
                            <div className="relative">
                                <input
                                    type="range"
                                    id={`weight-${key}`}
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={Math.round(pct)}
                                    onChange={(e) => handleSliderChange(key, e.target.value)}
                                    className="w-full"
                                    style={{
                                        background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${pct}%, #334155 ${pct}%, #334155 100%)`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Auto-normalize note */}
            <p className="text-xs text-slate-500 italic">
                Weights are auto-normalized to sum to 100%.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
                <button
                    onClick={onRunAnalysis}
                    disabled={!canRun}
                    className={[
                        'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200',
                        'flex items-center justify-center gap-2',
                        canRun
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:shadow-indigo-700/40 hover:-translate-y-0.5 active:translate-y-0'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed',
                    ].join(' ')}
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing…
                        </>
                    ) : (
                        <>
                            <span>🔍</span>
                            Run Analysis
                        </>
                    )}
                </button>

                <button
                    onClick={onReset}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all duration-200 border border-slate-700 hover:border-slate-500"
                >
                    Reset
                </button>
            </div>

            {/* Hint when no polygon */}
            {!hasPolygon && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-xs text-indigo-300">
                    <span className="mt-0.5 shrink-0">ℹ️</span>
                    <span>Draw a polygon on the map to enable analysis.</span>
                </div>
            )}
        </div>
    );
}
