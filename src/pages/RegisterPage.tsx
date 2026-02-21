import { useState } from 'react';
import { Building, Eye, EyeOff, Globe, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../constants/translations';
import { cn } from '../utils/cn';

const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'kz', label: 'ҚЗ', flag: '🇰🇿' },
];

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Қарағанды', 'Атырау', 'Павлодар', 'Семей', 'Тараз'];

export function RegisterPage({
    onSwitchToLogin,
    onLanguageChange,
    language
}: {
    onSwitchToLogin: () => void;
    onLanguageChange: (l: Language) => void;
    language: Language;
}) {
    const { register } = useAuth();
    const t = translations[language];

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessType: 'IP',
        iin: '',
        company: '',
        registrationDate: '',
        city: 'Алматы',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const update = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError(language === 'ru' ? 'Пароли не совпадают' : language === 'en' ? 'Passwords do not match' : 'Құпия сөздер сәйкес келмейді');
            return;
        }
        if (form.iin.length !== 12) {
            setError(language === 'ru' ? 'ИИН/БИН должен состоять из 12 цифр' : language === 'en' ? 'IIN/BIN must be 12 digits' : 'ЖСН/БСН 12 саннан тұруы тиіс');
            return;
        }
        if (form.password.length < 6) {
            setError(t.passwordMin);
            return;
        }

        setLoading(true);
        try {
            await register({
                email: form.email,
                password: form.password,
                name: form.name,
                businessType: form.businessType,
                iin: form.iin,
                company: form.company,
                registrationDate: form.registrationDate,
                city: form.city,
            });
        } catch (err: any) {
            setError(err.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
    const labelClass = "block text-sm font-medium text-white/80 mb-2";

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

            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 mb-3">
                        <Building className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Zhumash Bank</h1>
                    <p className="text-emerald-400 text-sm mt-1">{t.registerSubtitle}</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={onSwitchToLogin} className="text-white/60 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white">{t.createAccount}</h2>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Business Type */}
                        <div>
                            <label className={labelClass}>{t.businessType}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'IP', label: t.individualEntrepreneur },
                                    { value: 'TOO', label: t.llc },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => update('businessType', opt.value)}
                                        className={cn(
                                            'py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left',
                                            form.businessType === opt.value
                                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg'
                                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t.fullName} *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => update('name', e.target.value)}
                                    placeholder={language === 'ru' ? 'Иван Иванов' : language === 'en' ? 'John Doe' : 'Иван Иванов'}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{t.companyName}</label>
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={e => update('company', e.target.value)}
                                    placeholder={form.businessType === 'IP' ? 'ИП Иванов И.И.' : 'ТОО "Компания"'}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t.iinBin} * ({t.iinPlaceholder})</label>
                                <input
                                    type="text"
                                    value={form.iin}
                                    onChange={e => update('iin', e.target.value.replace(/\D/g, '').slice(0, 12))}
                                    placeholder="850101350789"
                                    required
                                    maxLength={12}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{t.city}</label>
                                <select
                                    value={form.city}
                                    onChange={e => update('city', e.target.value)}
                                    className={cn(inputClass, 'bg-white/10 cursor-pointer')}
                                >
                                    {CITIES.map(c => (
                                        <option key={c} value={c} className="bg-slate-800 text-white">{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t.email} *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => update('email', e.target.value)}
                                    placeholder="name@company.kz"
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{t.registrationDate}</label>
                                <input
                                    type="date"
                                    value={form.registrationDate}
                                    onChange={e => update('registrationDate', e.target.value)}
                                    className={cn(inputClass, 'cursor-pointer')}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t.password} * ({t.passwordMin})</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => update('password', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className={cn(inputClass, 'pr-12')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>{t.confirmPassword} *</label>
                                <input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={e => update('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={inputClass}
                                />
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
                            ) : t.register}
                        </button>
                    </form>

                    <p className="text-center text-white/60 text-sm mt-6">
                        {t.alreadyHaveAccount}{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            {t.login}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
