import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const WELCOME_MESSAGE = {
    role: 'ai',
    content: `👋 **Hello! I'm your GeoTOPSIS AI Assistant.**

I can help you with:
- 🗺️ **How the system works** — TOPSIS spatial analysis explained simply
- ⚖️ **Weight recommendations** — based on your project goals
- 📊 **Criteria explanations** — wind, slope, sun exposure, altitude, habitations

What would you like to know?`
};

const QUICK_PROMPTS = [
    'How does TOPSIS work?',
    'Recommend weights for max solar output',
    'What is "Exposition"?',
    'How many points do I need to draw?',
];

function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-1 py-1">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    style={{
                        animation: `typingBounce 1.2s infinite`,
                        animationDelay: `${i * 0.2}s`
                    }}
                />
            ))}
            <style>{`
                @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';

    // Very simple markdown-like renderer: bold (**text**), newlines, bullet lists
    const renderContent = (text) => {
        return text.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
                <p key={i} className={line.startsWith('-') ? 'flex gap-1.5 items-start' : ''}>
                    {line.startsWith('-') && <span>•</span>}
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{line.startsWith('-') && j === 0 ? part.slice(1).trim() : part}</span>;
                    })}
                </p>
            );
        });
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 mb-3`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-indigo-900/50">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.5 2.123m-10.5 0a2.25 2.25 0 001.5-2.123V3.104M15 3.104c.251.023.501.05.75.082M15 3.104a24.3 24.3 0 014.5 0" />
                    </svg>
                </div>
            )}

            <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed space-y-1 ${
                    isUser
                        ? 'bg-indigo-600 text-indigo-50 rounded-tr-sm shadow-lg shadow-indigo-900/30'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
                }`}
            >
                {renderContent(msg.content)}
            </div>

            {isUser && (
                <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export default function Chatbot({ polygon, results, weights, onApplyWeights, onRunAnalysis }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = (text ?? input).trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', content: trimmed };
        const newHistory = [...messages, userMsg];

        setMessages(newHistory);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:3000/api/chat', {
                messages: newHistory,
                appContext: {
                    polygon,
                    weights
                }
            });

            if (res.data.action && res.data.action.type === 'apply_weights') {
                if (onApplyWeights) {
                    onApplyWeights(res.data.action.weights);
                }
                if (onRunAnalysis && res.data.action.run) {
                    setTimeout(onRunAnalysis, 300);
                }
            }

            const aiMsg = { role: 'ai', content: res.data.answer };
            setMessages(prev => [...prev, aiMsg]);
            if (!open) setUnread(prev => prev + 1);
        } catch (err) {
            const errMsg = {
                role: 'ai',
                content: '⚠️ Sorry, I couldn\'t connect to the AI service. Please check that the backend is running and your DeepSeek API key is configured in the `.env` file.'
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, open]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat window */}
            <div
                className={`fixed bottom-20 right-5 w-[360px] max-h-[540px] z-[1500] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 transition-all duration-300 origin-bottom-right ${
                    open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-900/80 to-slate-900 border-b border-slate-700/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.5 2.123m-10.5 0a2.25 2.25 0 001.5-2.123V3.104M15 3.104c.251.023.501.05.75.082M15 3.104a24.3 24.3 0 014.5 0" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-tight">GeoTOPSIS Assistant</p>
                            <p className="text-xs text-indigo-400">Powered by DeepSeek AI</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} msg={msg} />
                    ))}
                    {loading && (
                        <div className="flex justify-start gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
                                </svg>
                            </div>
                            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-3.5 py-2">
                                <TypingDots />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick prompts */}
                {messages.length <= 1 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                        {QUICK_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(prompt)}
                                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input area */}
                <div className="px-3 py-3 border-t border-slate-700/80 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-indigo-500 transition-colors px-3 py-2">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about weights or the system..."
                            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none max-h-24 leading-relaxed"
                            style={{ scrollbarWidth: 'none' }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 mb-0.5"
                        >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-600 mt-1.5">Press Enter to send · Shift+Enter for newline</p>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`fixed bottom-5 right-5 z-[1500] w-13 h-13 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${
                    open
                        ? 'bg-slate-700 hover:bg-slate-600 rotate-0'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500'
                }`}
                style={{ width: '52px', height: '52px' }}
                title="Open AI Assistant"
            >
                {/* Unread badge */}
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow">
                        {unread}
                    </span>
                )}

                {/* Animated ring pulse when closed */}
                {!open && (
                    <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-25" />
                )}

                <svg
                    className={`w-5 h-5 text-white transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    {open ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    )}
                </svg>
            </button>
        </>
    );
}
