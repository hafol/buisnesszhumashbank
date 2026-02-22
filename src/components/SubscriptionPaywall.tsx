import { useState } from 'react';
import { Lock, Star, Check, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../services/api';
import { translations, Language } from '../constants/translations';
import { cn } from '../utils/cn';

interface SubscriptionPaywallProps {
    onClose: () => void;
    language: Language;
}

export function SubscriptionPaywall({ onClose, language }: SubscriptionPaywallProps) {
    const { user, isPremium } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const t = translations[language];

    const handleSubscribe = async () => {
        setError('');
        setLoading(true);
        try {
            const { url } = await paymentsApi.createCheckout(selectedPlan);
            window.location.href = url;
        } catch (err: any) {
            setError(err.message || 'Ошибка перенаправления на оплату');
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            id: 'monthly' as const,
            name: t.monthly,
            price: 2990,
            priceLabel: '₸ 2 990',
            period: t.perMonth,
            badge: null,
        },
        {
            id: 'yearly' as const,
            name: t.yearly,
            price: 24990,
            priceLabel: '₸ 24 990',
            period: t.perYear,
            badge: t.bestValue,
            monthlyEquivalent: '≈ ₸ 2 083 / мес',
        },
    ];

    const features = [t.feat1, t.feat2, t.feat3, t.feat4, t.feat5];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-white/10 shadow-2xl max-w-lg w-full">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Status Check */}
                {isPremium ? (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
                            <Star className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {user?.role === 'developer' ? t.developerAccess : t.alreadyPremium}
                        </h2>
                        {user?.subscription_end_date && user.role !== 'developer' && (
                            <p className="text-emerald-400">
                                {t.validUntil}: {new Date(user.subscription_end_date).toLocaleDateString()}
                            </p>
                        )}
                        <button
                            onClick={onClose}
                            className="mt-6 px-8 py-3 bg-emerald-500 text-white rounded-xl font-medium"
                        >
                            {t.close}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
                                <Lock className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t.premiumRequired}</h2>
                            <p className="text-white/60 text-sm mt-2 leading-relaxed">{t.premiumDesc}</p>

                            {/* Current plan badge */}
                            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-white/10 rounded-full">
                                <span className="text-white/50 text-xs">{t.currentPlan}</span>
                                <span className="text-white font-medium text-sm">{t.free}</span>
                            </div>
                        </div>

                        {/* Plans */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={cn(
                                        'relative p-4 rounded-2xl border-2 text-left transition-all',
                                        selectedPlan === plan.id
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    )}
                                >
                                    {plan.badge && (
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                            {plan.badge}
                                        </span>
                                    )}
                                    <p className="text-white/60 text-xs mb-1">{plan.name}</p>
                                    <p className="text-white font-bold text-xl">{plan.priceLabel}</p>
                                    <p className="text-white/40 text-xs">{plan.period}</p>
                                    {plan.monthlyEquivalent && (
                                        <p className="text-emerald-400 text-xs mt-1">{plan.monthlyEquivalent}</p>
                                    )}
                                    {selectedPlan === plan.id && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Features */}
                        <div className="mb-5 space-y-2">
                            <p className="text-white/50 text-xs uppercase tracking-wide mb-3">{t.allFeatures}</p>
                            {features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <span className="text-white/80 text-sm">{feat}</span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {t.loading}
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    {t.subscribeNow}
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
