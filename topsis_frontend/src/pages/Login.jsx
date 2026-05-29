import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, loginWithGoogle, loading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const { success, message } = await login(email, password);
        if (success) {
            navigate('/dashboard', { replace: true });
        } else {
            setError(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl shadow-indigo-900/20">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 mb-4">
                        <span className="text-white text-xl font-bold">T</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                    <p className="text-sm text-slate-400">Sign in to GeoTOPSIS</p>
                </div>

                {/* OAuth Button */}
                <button
                    onClick={loginWithGoogle}
                    disabled={loading}
                    className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/3840px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>

                <div className="relative flex items-center py-2 mb-6">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-wide font-medium">Or continue with</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                        <input
                            type="email"
                            required
                            disabled={loading}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            disabled={loading}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 px-4 flex justify-center items-center rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign in'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
