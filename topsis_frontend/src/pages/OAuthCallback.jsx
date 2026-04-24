import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/auth';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleOAuthCallback } = useAuth();

    // Prevent strict mode double-firing
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;

        const doAuth = async () => {
            const token = searchParams.get('token');

            if (!token) {
                navigate('/login?error=Missing+token');
                return;
            }

            try {
                handled.current = true;

                // Temporarily put the token in a header for just this getMe request
                // since handleOAuthCallback hasn't run globally yet
                const { data: user } = await getMe(token);

                // Now save to context which persists to localStorage + axios default headers
                handleOAuthCallback(token, user);

                // Redirect to protected dashboard
                navigate('/', { replace: true });
            } catch (err) {
                console.error("OAuth callback error", err);
                navigate('/login?error=Auth+Failed');
            }
        };

        doAuth();
    }, [searchParams, navigate, handleOAuthCallback]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400">Authenticating...</p>
            </div>
        </div>
    );
}
