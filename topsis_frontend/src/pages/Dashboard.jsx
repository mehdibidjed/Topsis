import { useState, useRef, useCallback } from 'react';
import MapView from '../components/MapView';
import WeightsPanel from '../components/WeightsPanel';
import ResultsList from '../components/ResultsList';
import HistoryPanel from '../components/HistoryPanel';
import Chatbot from '../components/Chatbot';
import { runTopsis } from '../api/topsis';
import { saveAnalysis } from '../api/history';
import { useAuth } from '../context/AuthContext';

const DEFAULT_WEIGHTS = {
    wind: 20,
    slope: 20,
    habitations: 20,
    exposure: 20,
    altitude: 20,
};

export default function Dashboard() {
    // ── State ──────────────────────────────────────────────────────────────────
    const { user, logout } = useAuth();
    const [polygon, setPolygon] = useState(null);      // [[lat,lng], ...]
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [drawState, setDrawState] = useState({ drawing: false, points: [], startDrawing: null, deleteLast: null, cancel: null });

    // Ref to MapView's imperative API (flyTo)
    const mapRef = useRef(null);
    // Ref to the Leaflet drawn FeatureGroup (for clearing)
    const drawnLayerRef = useRef(null);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handlePolygonComplete = useCallback((latlngs) => {
        setPolygon(latlngs);
        setResults([]);
        setError(null);
    }, []);

    const handleWeightsChange = useCallback((normalizedWeights) => {
        // normalizedWeights values are 0-1 fractions; keep as-is for API call
        setWeights(normalizedWeights);
    }, []);

    const handleRunAnalysis = useCallback(async () => {
        if (!polygon) return;
        setLoading(true);
        setError(null);
        try {
            const data = await runTopsis(polygon, weights);
            // Backend should return { results: [...] } or just an array
            const raw = Array.isArray(data) ? data : (data.results ?? []);
            setResults(raw);

            // Auto-save to history
            try {
                await saveAnalysis({ polygon, weights, results: raw });
            } catch (saveErr) {
                console.warn('Failed to auto-save analysis to history', saveErr);
            }

        } catch (err) {
            console.error('TOPSIS API error:', err);
            setError(err?.response?.data?.message ?? err.message ?? 'Analysis failed.');
        } finally {
            setLoading(false);
        }
    }, [polygon, weights]);

    const handleReset = useCallback(() => {
        setPolygon(null);
        setResults([]);
        setError(null);
        drawnLayerRef.current?.clearLayers();
    }, []);

    const handleCardClick = useCallback((item) => {
        mapRef.current?.flyTo(item.lat, item.lng);
    }, []);

    const handleLoadAnalysis = useCallback((savedPolygon, savedWeights, savedResults) => {
        setPolygon(savedPolygon);
        setWeights(savedWeights);
        setResults(savedResults);
        setError(null);

        // Re-draw polygon on the map
        if (drawnLayerRef.current && savedPolygon && savedPolygon.length > 0) {
            drawnLayerRef.current.clearLayers();
            const L = window.L;
            if (L) {
                const polygonLayer = L.polygon(savedPolygon, {
                    color: '#6366f1',
                    fillColor: '#6366f1',
                    fillOpacity: 0.15,
                    weight: 2,
                });
                drawnLayerRef.current.addLayer(polygonLayer);
                mapRef.current?.flyTo(savedPolygon[0][0], savedPolygon[0][1]);
            }
        }
    }, [drawnLayerRef, mapRef]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>

        <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
            <header className="flex items-center justify-between px-5 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800 shrink-0 z-10">
                <div className="flex items-center gap-3">
                    {/* Logo mark */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-base leading-none">GeoTOPSIS</h1>
                        <p className="text-indigo-400 text-xs leading-none mt-0.5">Geospatial Decision Support</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status pill */}
                    {polygon && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-3 py-1 animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ready
                        </div>
                    )}

                    <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                    {/* Auth Area */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-200 leading-none">{user?.name || 'Researcher'}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{user?.email}</p>
                        </div>

                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors tooltip"
                            title="Analysis History"
                        >
                            🕰️
                        </button>

                        <button
                            onClick={logout}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Log out"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Map (left, 70%) ── */}
                <main className="flex-1 min-w-0 relative">
                    <MapView
                        ref={mapRef}
                        results={results}
                        onPolygonComplete={handlePolygonComplete}
                        drawnLayerRef={drawnLayerRef}
                        onDrawStateChange={setDrawState}
                    />

                    {/* Map overlay — draw toolbar */}
                    {!polygon && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] animate-fade-in">
                            {/* Idle: not drawing, no polygon */}
                            {!drawState.drawing && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={drawState.startDrawing}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/50 text-white text-sm font-semibold"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l-6 6v3h3l6-6m3-9l3 3" />
                                        </svg>
                                        Draw Selection Area
                                    </button>
                                </div>
                            )}

                            {/* Active: drawing mode toolbar */}
                            {drawState.drawing && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/95 backdrop-blur border border-slate-700 shadow-2xl">
                                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mr-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                        {drawState.points.length}/4 points
                                    </div>
                                    <div className="w-px h-4 bg-slate-700" />
                                    <button
                                        onClick={drawState.deleteLast}
                                        disabled={drawState.points.length === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                                        </svg>
                                        Delete last
                                    </button>
                                    <button
                                        onClick={drawState.cancel}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* ── Right Panel (30%) ── */}
                <aside className="w-80 xl:w-96 shrink-0 flex flex-col border-l border-slate-800 bg-slate-900 overflow-hidden">

                    {/* ── TOP HALF: Weights ── */}
                    <div className="h-1/2 overflow-y-auto p-4 border-b border-slate-700/60">
                        <WeightsPanel
                            weights={weights}
                            onWeightsChange={handleWeightsChange}
                            onRunAnalysis={handleRunAnalysis}
                            onReset={handleReset}
                            hasPolygon={!!polygon}
                            loading={loading}
                        />

                        {/* Error banner inside weights half */}
                        {error && (
                            <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs animate-fade-in">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* ── BOTTOM HALF: Results ── */}
                    <div className="h-1/2 overflow-y-auto p-4">
                        <ResultsList
                            results={results}
                            loading={loading}
                            hasPolygon={!!polygon}
                            onCardClick={handleCardClick}
                        />
                    </div>
                </aside>

                <HistoryPanel
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    onLoadAnalysis={handleLoadAnalysis}
                />
            </div>
        </div>

        <Chatbot 
            polygon={polygon}
            results={results}
            weights={weights}
            onApplyWeights={setWeights}
            onRunAnalysis={handleRunAnalysis}
        />
        </>
    );
}
