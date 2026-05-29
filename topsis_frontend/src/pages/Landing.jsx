import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const { login, register, loginWithGoogle, loading, user } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isLoginView && password !== confirmPass) {
            return setError('Passwords do not match');
        }

        let result;
        if (isLoginView) {
            result = await login(email, password);
        } else {
            result = await register(name, email, password);
        }

        if (result.success) {
            navigate('/dashboard', { replace: true });
        } else {
            setError(result.message);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError(null);
        setPassword('');
        setConfirmPass('');
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-900 overflow-hidden">
            
            {/* Left Column - Overview */}
            <div className="relative flex flex-col justify-center p-8 md:p-16 lg:p-24 overflow-hidden order-2 md:order-1">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
                    <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[100px]"></div>
                </div>

                <div className="relative z-10 max-w-xl">
                    <div className="inline-block p-1 bg-indigo-500/10 rounded-xl mb-6">
                        <span className="bg-indigo-500/20 text-indigo-300 text-sm font-semibold px-3 py-1 rounded-lg">
                            GIS-Based DSS
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                        Discover the Optimal <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Location.</span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        GeoTOPSIS is an intelligent spatial decision support system. We combine OpenStreetMap data with the powerful TOPSIS multi-criteria analysis to help you discover the ideal geographic locations based on environmental, climatic, and spatial criteria.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 mt-8">
                        <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-1">MCDM Engine</h3>
                            <p className="text-sm text-slate-400">Evaluate multiple locations simultaneously against varied criteria parameters.</p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold mb-1">Live GIS Data</h3>
                            <p className="text-sm text-slate-400">Enriched mapped targets using OpenStreetMap buildings & reliable weather APIs.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Authentication */}
            <div className="flex flex-col justify-center items-center p-8 bg-slate-950/40 border-l border-slate-800 relative shadow-2xl order-1 md:order-2">
                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-black/50">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5">
                            <span className="text-white text-2xl font-bold font-serif">T</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLoginView ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isLoginView ? 'Sign in to access your dashboard' : 'Join GeoTOPSIS to rank locations'}
                        </p>
                    </div>

                    <button
                        onClick={async () => {
                            const res = await loginWithGoogle();
                            // loginWithGoogle usually redirects inside, but if it doesn't we might handle it.
                        }}
                        disabled={loading}
                        className="w-full mb-6 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition-all border border-slate-700/80 disabled:opacity-50"
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/3840px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <div className="relative flex items-center py-2 mb-6">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
                            Or continue with email
                        </span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {!isLoginView && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    disabled={loading}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                disabled={loading}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                disabled={loading}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {!isLoginView && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    disabled={loading}
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-3.5 px-4 flex justify-center items-center rounded-xl font-semibold text-[15px] text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                isLoginView ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        {isLoginView ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={toggleView}
                            className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-all"
                        >
                            {isLoginView ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
