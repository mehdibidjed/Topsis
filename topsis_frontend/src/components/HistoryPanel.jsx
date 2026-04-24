import { useEffect, useState } from 'react';
import { getHistory, deleteAnalysis } from '../api/history';

export default function HistoryPanel({ isOpen, onClose, onLoadAnalysis }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Couldn't load history");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // prevent card click
        try {
            await deleteAnalysis(id);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert("Failed to delete analysis");
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 xl:w-96 bg-slate-900 border-l border-slate-700 z-50 shadow-2xl flex flex-col animate-slide-up transform transition-transform duration-300">

                <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-950/50">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <span>🕰️</span> Analysis History
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs">
                            ⚠️ {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-slate-700 rounded-2xl">
                            <span className="text-3xl opacity-50">📂</span>
                            <p className="text-slate-400 text-sm">No analysis history yet.</p>
                        </div>
                    ) : (
                        history.map((record) => (
                            <div
                                key={record.id}
                                onClick={() => {
                                    onLoadAnalysis(record.polygon, record.weights, record.results);
                                    onClose();
                                }}
                                className="group relative flex flex-col gap-2 p-3 rounded-xl border border-slate-700/60 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-0.5"
                            >
                                {/* Delete btn */}
                                <button
                                    onClick={(e) => handleDelete(e, record.id)}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-slate-900 text-slate-500 hover:text-red-400 hover:bg-red-950/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                <div className="flex justify-between items-start pe-8">
                                    <h3 className="font-semibold text-slate-200 text-sm truncate">
                                        {record.name || `Analysis #${record.id}`}
                                    </h3>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700">
                                        📐 {record.polygon?.length || 0} pts
                                    </span>
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700">
                                        🏆 Top Score: {record.results?.[0]?.score?.toFixed(3) || 'N/A'}
                                    </span>
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700">
                                        🗓️ {new Date(record.date || record.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
