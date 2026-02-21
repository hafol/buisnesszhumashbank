import { useState } from 'react';
import { Building, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../constants/translations';
import { cn } from '../utils/cn';

interface AuthPageProps {
    onSwitchToRegister: () => void;
}

const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'kz', label: 'ҚЗ', flag: '🇰🇿' },
];

export function LoginPage({ onSwitchToRegister, onLanguageChange, language }: AuthPageProps & { onLanguageChange: (l: Language) => void; language: Language }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const t = translations[language];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
            {/* Language Toggle */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                <Globe className="w-4 h-4 text-white/60 mx-2" />
                {LANGUAGE_OPTIONS.map(l => (
                    <button
                        key={l.code}
                        onClick={() => onLanguageChange(l.code)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            language === l.code
                                ? 'bg-emerald-500 text-white shadow-lg'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                        )}
                    >
                        {l.flag} {l.label}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 mb-4">
                        <Building className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Zhumash Bank</h1>
                    <p className="text-emerald-400 text-sm mt-1">{t.loginSubtitle}</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">{t.loginToAccount}</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">{t.email}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@company.kz"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">{t.password}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {t.loading}
                                </span>
                            ) : t.login}
                        </button>
                    </form>

                    <p className="text-center text-white/60 text-sm mt-6">
                        {t.noAccount}{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            {t.register}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
