import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, Receipt, Calculator, FileText,
  Building2, ArrowLeftRight, Menu, X, Sun, Moon,
  Plus, Upload, Bot, TrendingUp, TrendingDown,
  CreditCard, Clock, CheckCircle2, AlertCircle, FileSearch, MapPin,
  Globe, Wallet, Calendar, Download, Printer, Sparkles,
  Building, Phone, Trash2, Eye, RefreshCw, LogOut, Crown, ArrowUpRight,
  MessageSquare, Send, Star, User
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from './utils/cn';
import { translations } from './constants/translations';
import type { Language, Theme, Currency, Project } from './types';
import {
  mockExchangeRates
} from './services/mockData';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SubscriptionPaywall } from './components/SubscriptionPaywall';
import { bankAccountsApi, projectsApi, documentsApi, exchangeApi, receiptsApi, aiApi, BASE_URL } from './services/api';

// Auth Gate - decides which page to show
export function App() {
  const { loading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('bzb_lang') as Language) || 'ru';
  });
  const { user } = useAuth();

  const handleLanguageChange = (l: Language) => {
    setLanguage(l);
    localStorage.setItem('bzb_lang', l);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} language={language} onLanguageChange={handleLanguageChange} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthPage('register')} language={language} onLanguageChange={handleLanguageChange} />;
  }

  return <AppShell language={language} setLanguage={handleLanguageChange} />;
}

// AppShell - full app UI (only rendered when authenticated)
function AppShell({ language, setLanguage }: { language: Language; setLanguage: (l: Language) => void }) {
  const { user, logout, isPremium } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('KZT');
  const [showPaywall, setShowPaywall] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real Data State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any>(mockExchangeRates);
  const [loading, setLoading] = useState(true);
  console.log('App loading state:', loading); // Use it
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [payrollTransactions, setPayrollTransactions] = useState<any[]>([]);

  const handleAddBank = async (bankData: any) => {
    try {
      const newAccount = await bankAccountsApi.create(bankData);
      setBankAccounts([newAccount, ...bankAccounts]);
      setShowAddBank(false);
    } catch (err) {
      console.error('Error adding bank account:', err);
      alert('Ошибка при добавлении счета');
    }
  };

  const handleFillDemoData = async () => {
    setCreatingDemo(true);
    try {
      // Create sample bank account
      await bankAccountsApi.create({
        bankName: 'Kaspi Bank',
        accountNumber: 'KZ499264023456789012',
        balance: 2500000,
        currency: 'KZT',
        color: '#ff0000'
      });

      // Create sample project
      await projectsApi.create({
        name: 'Мобильді қосымшаны әзірлеу',
        clientName: 'Digital Solutions LLP',
        totalCost: 5000000,
        currency: 'KZT',
        status: 'active',
        contractor: {
          name: 'Иван Иванов',
          email: 'ivan@example.com',
          phone: '+7 701 123 4567'
        },
        milestones: [
          { name: 'Дизайн', amount: 1000000, status: 'paid', deadline: '2024-03-01' },
          { name: 'Әзірлеу', amount: 3000000, status: 'pending', deadline: '2024-05-01' },
          { name: 'Тестілеу', amount: 1000000, status: 'pending', deadline: '2024-06-01' }
        ]
      });

      // Refresh all data
      const [accs, projs, docs, rats, recs] = await Promise.all([
        bankAccountsApi.list(),
        projectsApi.list(),
        documentsApi.list(),
        exchangeApi.rates().catch(() => mockExchangeRates),
        receiptsApi.list().catch(() => [])
      ]);
      setBankAccounts(accs);
      setProjects(projs);
      setDocuments(docs);
      setExchangeRates(rats);
      setReceipts(recs);

    } catch (err) {
      console.error('Error filling demo data:', err);
      alert('Ошибка при создании демо-данных');
    } finally {
      setCreatingDemo(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accs, projs, docs, rats, recs] = await Promise.all([
          bankAccountsApi.list(),
          projectsApi.list(),
          documentsApi.list(),
          exchangeApi.rates().catch(() => mockExchangeRates),
          receiptsApi.list().catch(() => [])
        ]);
        setBankAccounts(accs);
        setProjects(projs);
        setDocuments(docs);
        setExchangeRates(rats);
        setReceipts(recs);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const t = translations[language];
  const isDark = theme === 'dark';

  const modules = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'projects', icon: FolderKanban, label: t.projects },
    { id: 'cashRegister', icon: Receipt, label: t.cashRegister },
    { id: 'taxAccountant', icon: Calculator, label: t.taxAccountant, isPremium: true },
    { id: 'bankStatements', icon: FileText, label: t.bankStatements, isPremium: true },
    { id: 'documents', icon: FileSearch, label: t.documents, isPremium: true },
    { id: 'docGen', icon: Printer, label: t.docGenerator || 'Генератор', isPremium: true },
    { id: 'banks', icon: Building2, label: t.banks },
    { id: 'exchange', icon: ArrowLeftRight, label: t.exchange },
  ];

  const convertToDisplayCurrency = (amount: number, fromCurrency: Currency): number => {
    const rates: Record<Currency, number> = {
      KZT: 1,
      USD: exchangeRates.usdKzt || mockExchangeRates.usdKzt,
      EUR: exchangeRates.eurKzt || mockExchangeRates.eurKzt,
      RUB: exchangeRates.rubKzt || mockExchangeRates.rubKzt
    };
    const amountInKzt = amount * (rates[fromCurrency] || 1);
    return amountInKzt / (rates[displayCurrency] || 1);
  };

  const formatCurrency = (amount: number, currency: Currency = displayCurrency): string => {
    const symbols: Record<Currency, string> = { KZT: '₸', USD: '$', EUR: '€', RUB: '₽' };
    return `${symbols[currency]}${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const totalBalance = bankAccounts.reduce((sum, acc) => {
    return sum + convertToDisplayCurrency(acc.balance, acc.currency);
  }, 0);

  return (
    <div className={cn(
      'min-h-screen flex transition-colors duration-300 relative overflow-hidden',
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
    )}>
      {/* Premium Ambient Background */}
      <div className={cn(
        "fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px] pointer-events-none z-0",
        isDark ? "bg-emerald-500/20 mix-blend-screen" : "bg-emerald-400/30 mix-blend-multiply"
      )} />
      <div className={cn(
        "fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] pointer-events-none z-0",
        isDark ? "bg-teal-500/10 mix-blend-screen" : "bg-teal-400/30 mix-blend-multiply"
      )} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-40 transition-transform duration-300 md:translate-x-0 flex flex-col',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarOpen ? 'w-64' : 'w-20',
        isDark ? 'bg-slate-900/60 backdrop-blur-2xl border-slate-800' : 'bg-white/60 backdrop-blur-2xl border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
        'border-r'
      )}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Zhumash</h1>
                <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Bank</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(false);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            )}
          >
            <X className="w-5 h-5 md:hidden" />
            <div className="hidden md:block">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
          </button>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto pb-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => {
                if (module.isPremium && !isPremium) {
                  setShowPaywall(true);
                } else {
                  setActiveModule(module.id);
                  if (window.innerWidth < 768) setMobileMenuOpen(false);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all relative',
                activeModule === module.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              )}
            >
              <module.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium text-left flex-1">{module.label}</span>}
              {module.isPremium && sidebarOpen && (
                <Crown className={cn("w-4 h-4", activeModule === module.id ? "text-white/80" : "text-amber-500")} />
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-2 mt-auto">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            )}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
              isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            )}
          >
            <Globe className="w-5 h-5" />
            {sidebarOpen && <span>{language === 'ru' ? 'English' : 'Русский'}</span>}
          </button>

          {/* Mobile Only: Currency Toggle */}
          <div className="md:hidden pb-2">
            <CurrencyToggle
              current={displayCurrency}
              onChange={setDisplayCurrency}
              isDark={isDark}
            />
          </div>

          {/* Mobile Only: Logout */}
          <button
            onClick={logout}
            className={cn(
              'w-full flex md:hidden items-center gap-3 px-3 py-3 rounded-xl transition-colors',
              isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-left">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 transition-all duration-300 min-h-screen w-full',
        sidebarOpen ? 'md:ml-64' : 'md:ml-20'
      )}>
        {/* Header */}
        <header className={cn(
          'sticky top-0 z-30 px-6 py-4 border-b backdrop-blur-2xl transition-all duration-300',
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white/60 border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  'p-2 -ml-2 rounded-lg transition-colors md:hidden',
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                )}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold line-clamp-1">{modules.find(m => m.id === activeModule)?.label}</h2>
                <p className={cn('text-xs md:text-sm', isDark ? 'text-slate-400' : 'text-slate-500', 'line-clamp-1')}>
                  {user?.company} • {user?.iin}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:block">
                <CurrencyToggle
                  current={displayCurrency}
                  onChange={setDisplayCurrency}
                  isDark={isDark}
                />
              </div>

              {/* Language Switcher */}
              <div className={cn(
                'hidden md:flex items-center bg-white/5 rounded-xl p-1 border',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'
              )}>
                {(['ru', 'en', 'kz'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-bold transition-all uppercase',
                      language === l
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {!isPremium && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Premium</span>
                </button>
              )}

              <div className={cn(
                'flex items-center gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-xl',
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              )}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden md:block text-sm">
                  <p className="font-semibold">{user?.name}</p>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {user?.business_type === 'IP' ? t.ip : t.too}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className={cn(
                  'hidden md:flex p-2.5 rounded-xl transition-all border',
                  isDark
                    ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400'
                    : 'hover:bg-red-50 border-slate-200 text-slate-500 hover:text-red-600'
                )}
                title={t.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {showPaywall && (
          <SubscriptionPaywall
            onClose={() => setShowPaywall(false)}
            language={language}
          />
        )}

        {/* Module Content */}
        <div className="p-6 relative z-10 w-full">
          {activeModule === 'dashboard' && (
            <DashboardModule
              t={t}
              isDark={isDark}
              formatCurrency={formatCurrency}
              totalBalance={totalBalance}
              displayCurrency={displayCurrency}
              bankAccounts={bankAccounts}
              projects={projects}
              documents={documents}
              theme={theme}
              setTheme={setTheme}
              setActiveModule={setActiveModule}
              onFillDemo={handleFillDemoData}
              creatingDemo={creatingDemo}
            />
          )}
          {activeModule === 'projects' && (
            <ProjectsModule
              t={t}
              isDark={isDark}
              projects={projects}
              setProjects={setProjects}
              formatCurrency={formatCurrency}
            />
          )}
          {activeModule === 'cashRegister' && (
            <CashRegisterModule
              t={t}
              isDark={isDark}
              user={user}
              formatCurrency={formatCurrency}
              receipts={receipts}
              setReceipts={setReceipts}
            />
          )}
          {activeModule === 'taxAccountant' && (
            <TaxAccountantModule
              t={t}
              isDark={isDark}
              formatCurrency={formatCurrency}
              payrollTransactions={payrollTransactions}
              user={user}
            />
          )}
          {activeModule === 'bankStatements' && (
            <BankStatementsModule
              t={t}
              isDark={isDark}
              formatCurrency={formatCurrency}
              payrollTransactions={payrollTransactions}
              setPayrollTransactions={setPayrollTransactions}
            />
          )}
          {activeModule === 'documents' && (
            <DocumentsModule
              t={t}
              isDark={isDark}
              documents={documents}
              setDocuments={setDocuments}
            />
          )}
          {activeModule === 'docGen' && (
            <DocumentGeneratorModule
              t={t}
              isDark={isDark}
            />
          )}
          {activeModule === 'banks' && (
            <MultiBankModule
              t={t}
              isDark={isDark}
              bankAccounts={bankAccounts}
              setBankAccounts={setBankAccounts}
              formatCurrency={formatCurrency}
              displayCurrency={displayCurrency}
              convertToDisplayCurrency={convertToDisplayCurrency}
              setShowAddBank={setShowAddBank}
            />
          )}
          {activeModule === 'exchange' && (
            <ExchangeModule t={t} isDark={isDark} exchangeRates={exchangeRates} language={language} />
          )}
        </div>
      </main>

      {/* Add Bank Modal */}
      {showAddBank && (
        <AddBankModal
          t={t}
          isDark={isDark}
          onClose={() => setShowAddBank(false)}
          onAdd={handleAddBank}
        />
      )}
    </div>
  );
}

// Add Bank Modal Component
function AddBankModal({ t, isDark, onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    balance: 0,
    currency: 'KZT',
    color: '#10B981'
  });

  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#64748B'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200',
        isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{t.addBankAccount}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.bankName}</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="Halyk Bank, Kaspi..."
              className={cn(
                'w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all',
                isDark ? 'bg-slate-700 border-slate-600 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500'
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t.currency}</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={cn(
                  'w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all',
                  isDark ? 'bg-slate-700 border-slate-600 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500'
                )}
              >
                <option value="KZT">KZT (₸)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t.initialBalance}</label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                className={cn(
                  'w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all',
                  isDark ? 'bg-slate-700 border-slate-600 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500'
                )}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.accountNumber}</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="KZ..."
              className={cn(
                'w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all',
                isDark ? 'bg-slate-700 border-slate-600 focus:ring-emerald-500' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500'
              )}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t.selectColor}</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.color === color ? 'border-white scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all',
              isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'
            )}
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onAdd(formData)}
            disabled={!formData.bankName || !formData.accountNumber}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// Currency Toggle Component
function CurrencyToggle({ current, onChange, isDark }: {
  current: Currency;
  onChange: (c: Currency) => void;
  isDark: boolean
}) {
  const currencies: Currency[] = ['KZT', 'USD', 'EUR', 'RUB'];
  return (
    <div className={cn(
      'flex rounded-xl p-1',
      isDark ? 'bg-slate-800' : 'bg-slate-100'
    )}>
      {currencies.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            current === c
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// Dashboard Module
function DashboardModule({
  t, isDark, formatCurrency, totalBalance, displayCurrency,
  bankAccounts, projects, documents, theme, setTheme,
  setActiveModule, onFillDemo, creatingDemo
}: any) {
  console.log('Dashboard context:', { displayCurrency, documents, theme }); // Use them
  const activeProjectsCount = projects.filter((p: any) => p.status === 'active').length;

  // Stats calculation
  const monthlyIncome = 0; // Will be connected to transactions
  const monthlyExpenses = 0; // Will be connected to transactions
  const pendingTaxes = 0; // Will be connected to AI tax calculator

  const stats = [
    { label: t.totalBalance, value: formatCurrency(totalBalance), icon: Wallet, color: 'from-emerald-500 to-teal-600', trend: '+12.5%', trendUp: true },
    { label: t.monthlyIncome, value: formatCurrency(monthlyIncome), icon: TrendingUp, color: 'from-blue-500 to-indigo-600', trend: '+8.2%', trendUp: true },
    { label: t.monthlyExpenses, value: formatCurrency(monthlyExpenses), icon: TrendingDown, color: 'from-rose-500 to-pink-600', trend: '-2.4%', trendUp: false },
    { label: t.pendingTaxes, value: formatCurrency(pendingTaxes), icon: Calculator, color: 'from-amber-500 to-orange-600', trend: 'Due in 12d', trendUp: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard}</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            {t.quickActions}
          </p>
        </div>
        <div className="flex gap-3">
          <button className={cn(
            'p-2.5 rounded-xl border transition-all',
            isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'
          )}>
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              'p-2.5 rounded-xl border transition-all',
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'
            )}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={cn(
            'p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group',
            isDark ? 'bg-slate-900/40 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/50' : 'bg-white/50 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/70'
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-3 rounded-2xl bg-gradient-to-br text-white', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.trend !== null && (
                <div className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1',
                  stat.trendUp === true ? 'bg-emerald-500/10 text-emerald-500' :
                    stat.trendUp === false ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'
                )}>
                  {stat.trendUp === true ? <TrendingUp className="w-3 h-3" /> :
                    stat.trendUp === false ? <TrendingDown className="w-3 h-3" /> : null}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className={cn(
          'p-6 rounded-3xl border relative overflow-hidden',
          isDark ? 'bg-slate-900/40 backdrop-blur-xl border-slate-700/50' : 'bg-white/50 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        )}>
          <h3 className="text-lg font-bold mb-4">{t.quickActions}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Plus, label: t.newProject, color: 'emerald', module: 'projects' },
              { icon: Receipt, label: t.issueReceipt, color: 'blue', module: 'cashRegister' },
              { icon: Calculator, label: t.calcTax, color: 'purple', module: 'taxAccountant' },
              { icon: Upload, label: t.uploadStatement, color: 'orange', module: 'bankStatements' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveModule(action.module)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]',
                  isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-50 hover:bg-slate-100'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  action.color === 'emerald' && 'bg-emerald-500/20 text-emerald-500',
                  action.color === 'blue' && 'bg-blue-500/20 text-blue-500',
                  action.color === 'purple' && 'bg-purple-500/20 text-purple-500',
                  action.color === 'orange' && 'bg-orange-500/20 text-orange-500'
                )}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Data Call to Action for new users */}
        {bankAccounts.length === 0 && projects.length === 0 && (
          <div className={cn(
            'p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4',
            isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
          )}>
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{t.fillDemoData}</h3>
              <p className={cn('max-w-md mx-auto', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {t.demoDataDesc}
              </p>
            </div>
            <button
              onClick={onFillDemo}
              disabled={creatingDemo}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {creatingDemo ? t.loadingDemo : t.fillDemoData}
            </button>
          </div>
        )}

        {/* Recent Activity / Active Projects Summary */}
        <div className={cn(
          'p-6 rounded-3xl border',
          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t.activeProjects}</h3>
            <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-lg">
              {activeProjectsCount}
            </div>
          </div>
          <div className="space-y-4">
            {projects.filter((p: any) => p.status === 'active').slice(0, 2).map((project: any) => (
              <div key={project.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{project.name}</p>
                  <p className="text-xs font-bold">{formatCurrency(project.total_cost)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{project.contractor_name || t.noData}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 uppercase">
                    {t.active}
                  </span>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-6 text-slate-500 italic text-sm">
                {t.noData}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Projects Module
function ProjectsModule({ t, isDark, projects, setProjects, formatCurrency }: any) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const analyzeContract = async (project: Project) => {
    setAiAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAiResult(project.documents[0]?.aiAnalysis);
      setAiAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{t.projectManagement}</h3>
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Управляйте проектами и этапами оплаты
          </p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.newProject}
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project: any) => (
          <div
            key={project.id}
            className={cn(
              'p-6 rounded-2xl border transition-all hover:shadow-lg cursor-pointer',
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
              selectedProject?.id === project.id && 'ring-2 ring-emerald-500'
            )}
            onClick={() => setSelectedProject(project)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">{project.name}</h4>
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {project.description}
                </p>
              </div>
              <span className={cn(
                'text-xs px-3 py-1 rounded-full font-medium',
                project.status === 'active' && 'bg-emerald-500/20 text-emerald-500',
                project.status === 'completed' && 'bg-blue-500/20 text-blue-500',
                project.status === 'paused' && 'bg-orange-500/20 text-orange-500'
              )}>
                {project.status === 'active' ? t.active : project.status === 'completed' ? t.completed : t.paused}
              </span>
            </div>

            {/* Contractor Info */}
            <div className={cn(
              'p-4 rounded-xl mb-4',
              isDark ? 'bg-slate-700/50' : 'bg-slate-50'
            )}>
              <p className="text-sm font-medium mb-2">{t.contractor}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{project.contractor.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>ИИН/БИН: {project.contractor.iinBin}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{project.contractor.phone}</span>
                </div>
              </div>
            </div>

            {/* Cost & Progress */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.projectCost}</p>
                <p className="text-2xl font-bold">₸{project.totalCost.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.paid}</p>
                <p className="text-lg font-semibold text-emerald-500">
                  {formatCurrency((project.milestones || []).filter((m: any) => m.status === 'paid').reduce((s: number, m: any) => s + m.amount, 0))}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{
                    width: `${(project.milestones.filter((m: any) => m.status === 'paid').reduce((s: number, m: any) => s + m.amount, 0) / project.totalCost) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.milestones}</p>
              {project.milestones.map((milestone: any, idx: number) => (
                <div
                  key={milestone.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg text-sm',
                    isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {milestone.status === 'paid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : milestone.status === 'overdue' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                    <span className={milestone.status === 'paid' ? 'line-through text-slate-400' : ''}>
                      {milestone.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{milestone.dueDate}</span>
                    <span className="font-medium">₸{milestone.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Documents & AI Analysis */}
            {project.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{project.documents.length} документ(ов)</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); analyzeContract(project); }}
                    disabled={aiAnalyzing}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      aiAnalyzing
                        ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                        : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                    )}
                  >
                    <Sparkles className={cn('w-4 h-4', aiAnalyzing && 'animate-pulse')} />
                    {aiAnalyzing ? t.aiAnalyzing : t.analyzeContract}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Analysis Modal */}
      {aiResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={cn(
            'w-full max-w-2xl rounded-2xl p-6 max-h-[80vh] overflow-y-auto',
            isDark ? 'bg-slate-800' : 'bg-white'
          )}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Bot className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t.aiSummary}</h3>
                  <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Анализ контракта выполнен ИИ
                  </p>
                </div>
              </div>
              <button onClick={() => setAiResult(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700' : 'bg-slate-50')}>
                <h4 className="font-medium mb-2">Резюме</h4>
                <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>{aiResult.summary}</p>
              </div>

              <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700' : 'bg-slate-50')}>
                <h4 className="font-medium mb-2">{t.keyTerms}</h4>
                <ul className="space-y-1">
                  {aiResult.keyTerms.map((term: string, idx: number) => (
                    <li key={idx} className={cn('text-sm flex items-start gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {term}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700' : 'bg-slate-50')}>
                <h4 className="font-medium mb-2">{t.obligations}</h4>
                <ul className="space-y-1">
                  {aiResult.obligations.map((obl: string, idx: number) => (
                    <li key={idx} className={cn('text-sm flex items-start gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {obl}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn('p-4 rounded-xl bg-red-500/10 border border-red-500/20')}>
                <h4 className="font-medium mb-2 text-red-500">{t.risks}</h4>
                <ul className="space-y-1">
                  {aiResult.risks.map((risk: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700' : 'bg-slate-50')}>
                <h4 className="font-medium mb-2">Ключевые даты</h4>
                <div className="space-y-2">
                  {aiResult.deadlines.map((dl: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{dl.description}</span>
                      <span className="font-medium">{dl.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <NewProjectModal
          isDark={isDark}
          t={t}
          onClose={() => setShowNewProject(false)}
          onAdd={(p: any) => setProjects([p, ...projects])}
        />
      )}
    </div>
  );
}

// New Project Modal Component
function NewProjectModal({ isDark, t, onClose, onAdd }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_cost: 0,
    contractor_name: '',
    contractor_iin: '',
    contractor_phone: '',
    contractor_email: ''
  });
  const [milestones, setMilestones] = useState([{ id: '1', description: '', amount: 0, dueDate: '' }]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newProject = await projectsApi.create(formData);
      onAdd(newProject);
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Ошибка при создании проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        'w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto',
        isDark ? 'bg-slate-800' : 'bg-white'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{t.newProject}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">{t.projectName}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Ремонт офиса"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">{t.projectDescription}</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание проекта..."
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500 resize-none',
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.projectCost} (KZT)</label>
              <input
                type="number"
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: Number(e.target.value) })}
                placeholder="1200000"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                )}
              />
            </div>
          </div>

          {/* Contractor */}
          <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700/50' : 'bg-slate-50')}>
            <h4 className="font-medium mb-4">{t.contractor}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.contractorName}</label>
                <input
                  type="text"
                  value={formData.contractor_name}
                  onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                  placeholder="ТОО/ИП название"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                    isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.contractorIin}</label>
                <input
                  type="text"
                  value={formData.contractor_iin}
                  onChange={(e) => setFormData({ ...formData, contractor_iin: e.target.value })}
                  placeholder="12 цифр"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                    isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.contractorPhone}</label>
                <input
                  type="tel"
                  value={formData.contractor_phone}
                  onChange={(e) => setFormData({ ...formData, contractor_phone: e.target.value })}
                  placeholder="+7 7XX XXX XXXX"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                    isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.contractorEmail}</label>
                <input
                  type="email"
                  value={formData.contractor_email}
                  onChange={(e) => setFormData({ ...formData, contractor_email: e.target.value })}
                  placeholder="email@example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500',
                    isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className={cn('p-4 rounded-xl', isDark ? 'bg-slate-700/50' : 'bg-slate-50')}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{t.milestones}</h4>
              <button
                onClick={() => setMilestones([...milestones, { id: Date.now().toString(), description: '', amount: 0, dueDate: '' }])}
                className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-600"
              >
                <Plus className="w-4 h-4" />
                {t.addMilestone}
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isDark ? 'bg-slate-600' : 'bg-slate-200'
                  )}>
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[idx].description = e.target.value;
                      setMilestones(newMilestones);
                    }}
                    placeholder="Описание этапа"
                    className={cn(
                      'flex-1 px-4 py-2 rounded-xl border outline-none text-sm',
                      isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                    )}
                  />
                  <input
                    type="number"
                    value={m.amount}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[idx].amount = Number(e.target.value);
                      setMilestones(newMilestones);
                    }}
                    placeholder="Сумма"
                    className={cn(
                      'w-32 px-4 py-2 rounded-xl border outline-none text-sm',
                      isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                    )}
                  />
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[idx].dueDate = e.target.value;
                      setMilestones(newMilestones);
                    }}
                    className={cn(
                      'px-4 py-2 rounded-xl border outline-none text-sm',
                      isDark ? 'bg-slate-600 border-slate-500' : 'bg-white border-slate-200'
                    )}
                  />
                  <button
                    onClick={() => setMilestones(milestones.filter(ms => ms.id !== m.id))}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-6 py-2 rounded-xl font-medium transition-colors',
                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              )}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? t.loading : t.add}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cash Register Module
function CashRegisterModule({ t, isDark, user, formatCurrency, receipts, setReceipts }: any) {
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', iin: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const generateReceipt = async () => {
    setLoading(true);
    try {
      const receiptData = {
        customer_name: customerInfo.name,
        customer_iin: customerInfo.iin,
        items: items.filter(i => i.description),
        total,
        payment_method: paymentMethod,
        date: new Date().toISOString()
      };
      const newReceipt = await receiptsApi.create(receiptData);
      setGeneratedReceipt(newReceipt);
      setReceipts([newReceipt, ...receipts]);
      setShowReceipt(true);
      // Reset form
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setCustomerInfo({ name: '', iin: '' });
    } catch (err) {
      console.error('Error creating receipt:', err);
      alert('Ошибка при создании чека');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Receipt Form */}
        <div className={cn(
          'p-6 rounded-2xl border',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        )}>
          <h3 className="text-lg font-semibold mb-4">{t.newReceipt}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.customerName}</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder={t.customerNamePlaceholder}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none',
                    isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.customerIin}</label>
                <input
                  type="text"
                  value={customerInfo.iin}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, iin: e.target.value })}
                  placeholder={t.iinPlaceholder}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none',
                    isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                  )}
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">{t.items}</label>
                <button
                  onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])}
                  className="text-sm text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t.addItem}
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t.itemDescription}
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].description = e.target.value;
                        setItems(newItems);
                      }}
                      className={cn(
                        'flex-1 px-4 py-2 rounded-xl border outline-none text-sm',
                        isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                      )}
                    />
                    <input
                      type="number"
                      placeholder={t.quantity}
                      value={item.quantity || ''}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className={cn(
                        'w-20 px-3 py-2 rounded-xl border outline-none text-sm text-center',
                        isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                      )}
                    />
                    <input
                      type="number"
                      placeholder={t.unitPrice}
                      value={item.unitPrice || ''}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].unitPrice = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className={cn(
                        'w-28 px-3 py-2 rounded-xl border outline-none text-sm',
                        isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                      )}
                    />
                    <span className="w-24 text-right font-medium">
                      ₸{(item.quantity * item.unitPrice).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-2">{t.paymentMethod}</label>
              <div className="flex gap-2">
                {['cash', 'card', 'transfer'].map((method: any) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      paymentMethod === method
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    )}
                  >
                    {method === 'cash' ? t.cash : method === 'card' ? t.card : t.transfer}
                  </button>
                ))}
              </div>
            </div>

            {/* Total & Generate */}
            <div className={cn(
              'p-4 rounded-xl',
              isDark ? 'bg-slate-700' : 'bg-slate-100'
            )}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">{t.total}:</span>
                <span className="text-2xl font-bold text-emerald-500">{formatCurrency(total)}</span>
              </div>
              <button
                onClick={generateReceipt}
                disabled={total === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? t.loading : t.generateReceipt}
              </button>
            </div>
          </div>
        </div>

        {/* Receipt History */}
        <div className={cn(
          'p-6 rounded-2xl border',
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        )}>
          <h3 className="text-lg font-semibold mb-4">{t.receiptHistory}</h3>
          <div className="space-y-3">
            {receipts.map((receipt: any) => (
              <div
                key={receipt.id}
                className={cn(
                  'p-4 rounded-xl transition-colors cursor-pointer',
                  isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Receipt className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">Чек #{receipt.receiptNumber}</p>
                      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {receipt.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">₸{receipt.total.toLocaleString()}</p>
                    <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      {receipt.paymentMethod === 'cash' ? t.cash : receipt.paymentMethod === 'card' ? t.card : t.transfer}
                    </p>
                  </div>
                </div>
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {receipt.customerName}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600">
                    <Eye className="w-3 h-3" />
                    {t.view}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-600">
                    <Download className="w-3 h-3" />
                    {t.download}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-600">
                    <Printer className="w-3 h-3" />
                    {t.print}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Receipt Modal */}
      {showReceipt && generatedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="text-center border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">{user?.company}</h3>
              <p className="text-sm text-slate-500">ИИН/БИН: {user?.iin}</p>
              <p className="text-sm text-slate-500">г. Алматы, ул. Абая 150</p>
            </div>

            <div className="text-center mb-4">
              <p className="text-2xl font-mono font-bold">ЧЕК #{generatedReceipt.number}</p>
              <p className="text-sm text-slate-500">{generatedReceipt.date} {generatedReceipt.time}</p>
            </div>

            <div className="border-t border-b border-dashed py-4 mb-4">
              {generatedReceipt.items.filter((i: any) => i.description).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700">
                    {item.description} x{item.quantity}
                  </span>
                  <span className="font-medium">₸{(item.quantity * item.unitPrice).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>ИТОГО:</span>
              <span>₸{generatedReceipt.total.toLocaleString()}</span>
            </div>

            <div className="text-center text-sm text-slate-500 mb-6">
              <p>Спасибо за покупку!</p>
              <p className="mt-2">Фискальный номер: {Date.now()}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 text-slate-700"
              >
                Закрыть
              </button>
              <button className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                Печать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tax Accountant Module
function TaxAccountantModule({ t, isDark, formatCurrency, payrollTransactions, user }: any) {
  const [calculating, setCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taxData, setTaxData] = useState<any>(null);
  const [income, setIncome] = useState(0);
  const [regime, setRegime] = useState('simplified');
  const [userType, setUserType] = useState<'business' | 'individual'>('business');
  const [businessType, setBusinessType] = useState('ip');

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleGetFromTransactions = () => {
    const total = (payrollTransactions || [])
      .filter((tx: any) => tx.type === 'income')
      .reduce((sum: number, tx: any) => sum + tx.amount, 0);
    setIncome(total);
  };

  const runCalculation = async () => {
    setCalculating(true);
    try {
      const result = await aiApi.calculateTaxes({
        userType,
        businessType,
        taxRegime: regime,
        income,
        period: '2024',
        employeeCount: user?.employeeCount || 0
      });
      setTaxData(result);
      setShowResults(true);

      // Initialize chat with a welcome message if results are shown
      if (messages.length === 0) {
        setMessages([{ role: 'bot', text: t.chatWelcome }]);
      }
    } catch (err: any) {
      console.error('Error calculating taxes:', err);
      alert(t.error + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setCalculating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const result = await aiApi.taxChat({
        message: userMsg,
        context: {
          taxData,
          userType,
          regime
        }
      });
      setMessages(prev => [...prev, { role: 'bot', text: result.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: t.error + ': ' + (err.response?.data?.error || err.message) }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Configuration Section */}
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t.expertAccountant}</h3>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {t.expertSub}
              </p>
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setUserType('business')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', userType === 'business' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500')}
            >
              {t.business}
            </button>
            <button
              onClick={() => setUserType('individual')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', userType === 'individual' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500')}
            >
              {t.individual}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {userType === 'business' ? (
            <div>
              <label className="block text-sm font-medium mb-2">{t.ownershipForm}</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-purple-500/20',
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                )}
              >
                <option value="ip">{t.individualEntrepreneur}</option>
                <option value="too">{t.llc}</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">{t.category}</label>
              <div className={cn(
                'w-full px-4 py-3 rounded-xl border flex items-center gap-2',
                isDark ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              )}>
                <User className="w-4 h-4" />
                <span>{t.physicalPerson}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t.taxRegime}</label>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-purple-500/20',
                isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
              )}
            >
              {userType === 'business' ? (
                <>
                  <option value="simplified">{t.simplified}</option>
                  <option value="general">{t.general}</option>
                  <option value="patent">{t.patent}</option>
                  <option value="retail">{t.retailTax}</option>
                </>
              ) : (
                <>
                  <option value="standard">{t.standardIpn}</option>
                  <option value="property">{t.propertyTax}</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.incomeForPeriod}</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-purple-500/20',
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                )}
              />
              <button
                onClick={handleGetFromTransactions}
                className={cn(
                  'px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2',
                  isDark ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                )}
                title={t.getFromTransactions}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={runCalculation}
          disabled={calculating}
          className={cn(
            'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
            calculating
              ? 'bg-purple-500/50 cursor-wait'
              : 'bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.99]',
            'text-white'
          )}
        >
          {calculating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {t.calculatedExpert}
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              {t.calcAllTaxes}
            </>
          )}
        </button>
      </div>

      {showResults && taxData && (
        <>
          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={cn('p-6 rounded-2xl border bg-gradient-to-br', isDark ? 'from-slate-800 to-slate-800/50 border-slate-700' : 'from-white to-slate-50 border-slate-200')}>
              <p className={cn('text-sm mb-1 font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.totalIncome}</p>
              <h4 className="text-2xl font-bold">{formatCurrency(taxData.totalIncome)}</h4>
            </div>
            <div className={cn('p-6 rounded-2xl border bg-gradient-to-br', isDark ? 'from-slate-800 to-slate-800/50 border-slate-700' : 'from-white to-slate-50 border-slate-200')}>
              <p className={cn('text-sm mb-1 font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.taxRate}</p>
              <h4 className="text-2xl font-bold text-purple-500">{taxData.taxRate}%</h4>
            </div>
            <div className={cn('p-6 rounded-2xl border bg-gradient-to-br from-red-50 to-white dark:from-red-500/5 dark:to-slate-800 border-red-100 dark:border-red-500/20')}>
              <p className={cn('text-sm mb-1 font-medium text-red-500')}>{t.taxAmount}</p>
              <h4 className="text-2xl font-bold text-red-600">{formatCurrency(taxData.taxAmount)}</h4>
            </div>
            <div className={cn('p-6 rounded-2xl border bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/5 dark:to-slate-800 border-emerald-100 dark:border-emerald-500/20')}>
              <p className={cn('text-sm mb-1 font-medium text-emerald-500')}>{t.totalToPay}</p>
              <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(taxData.totalPayable)}</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Breakdown & Advice */}
            <div className="lg:col-span-2 space-y-6">
              {/* Advice Alert */}
              <div className={cn(
                'p-4 rounded-2xl border flex gap-4',
                isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'
              )}>
                <div className="p-2 rounded-xl bg-amber-500/10 h-fit">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-700 dark:text-amber-500 mb-1">{t.expertAdvice}</h4>
                  <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-600')}>
                    {taxData.expertAdvice}
                  </p>
                </div>
              </div>

              {/* Tax Details Table */}
              <div className={cn('p-6 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  {t.taxPaymentDetails}
                </h3>
                <div className="space-y-3">
                  {taxData.taxBreakdown.map((item: any, idx: number) => (
                    <div key={idx} className={cn('p-4 rounded-xl border', isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100')}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                      <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Deadlines & Instructions */}
            <div className="space-y-6">
              <div className={cn('p-6 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {t.importantDeadlines}
                </h3>
                <div className="space-y-4">
                  {taxData.declarations.map((decl: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-1 h-12 bg-blue-500 rounded-full shrink-0" />
                      <div>
                        <p className="text-sm font-bold">{decl.formNumber}: {decl.name}</p>
                        <p className="text-xs text-red-500 font-medium">{t.deadline}: {decl.deadline}</p>
                        <a href={decl.whereToFile} className="text-xs text-blue-500 hover:underline">{t.whereToFile}: {decl.whereToFile}</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn('p-6 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  {t.kbkRequisites}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.bin}:</span>
                    <span className="font-mono font-medium">{taxData.paymentDetails.bin}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.kbk}:</span>
                    <span className="font-mono font-bold text-blue-500">{taxData.paymentDetails.kbk}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.knp}:</span>
                    <span className="font-mono font-medium">{taxData.paymentDetails.knp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Chat / Support */}
      <div className="fixed bottom-8 right-8 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:scale-110 transition-all flex items-center justify-center animate-bounce-slow"
          >
            <MessageSquare className="w-7 h-7" />
          </button>
        ) : (
          <div className={cn(
            'w-[380px] h-[500px] rounded-3xl shadow-2xl flex flex-col border overflow-hidden animate-in slide-in-from-bottom-5',
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          )}>
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-semibold">{t.chatWithAccountant}</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className={cn('text-sm px-6', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {t.chatWelcome}
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : isDark ? 'bg-slate-700 text-slate-200 rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={cn('p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 flex gap-1')}>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.chatPlaceholder}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-xl border outline-none text-sm',
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  )}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading}
                  className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Bank Statements Module
function BankStatementsModule({ t, isDark, formatCurrency, payrollTransactions, setPayrollTransactions }: any) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(payrollTransactions.length > 0);
  const [filter, setFilter] = useState<'all' | 'income' | 'office' | 'payroll' | 'taxes' | 'transfer' | 'other'>('all');

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('statement', file);
      const results = await aiApi.parsePayroll(formData);
      setPayrollTransactions(results.transactions || []);
      setParsed(true);
    } catch (err: any) {
      console.error('Error parsing payroll:', err);
      alert(t.parsingFileError + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setParsing(false);
    }
  };

  const filteredTransactions = payrollTransactions.filter((tx: any) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const totalIncoming = payrollTransactions.filter((tx: any) => tx.type === 'income').reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalOutgoing = payrollTransactions.filter((tx: any) => tx.type !== 'income').reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'income': return 'bg-emerald-500/10 text-emerald-500';
      case 'office': return 'bg-orange-500/10 text-orange-500';
      case 'payroll': return 'bg-blue-500/10 text-blue-500';
      case 'taxes': return 'bg-red-500/10 text-red-500';
      case 'transfer': return 'bg-slate-500/10 text-slate-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'income': return t.categoryIncome;
      case 'office': return t.categoryOffice;
      case 'payroll': return t.categoryPayroll;
      case 'taxes': return t.categoryTaxes;
      case 'transfer': return t.categoryTransfer;
      default: return t.categoryOther;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">{t.transactionsAiDashboard}</h3>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {t.transactionsAiSub}
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="file"
            id="statement-upload"
            className="hidden"
            onChange={handleUpload}
            disabled={parsing}
            accept=".pdf,.csv,.xlsx"
          />
          <label
            htmlFor="statement-upload"
            className={cn(
              'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
              isDark
                ? 'border-slate-700 hover:border-blue-500 bg-slate-800/50 hover:bg-slate-800'
                : 'border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-slate-100'
            )}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-sm font-medium">{t.parsing}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium">{t.uploadAndParse}</span>
                <span className="text-xs text-slate-500">PDF, Excel, CSV</span>
              </div>
            )}
          </label>
        </div>

        {/* AI Prompt Info */}
        <div className={cn(
          'mt-4 p-4 rounded-xl',
          isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">AI Prompt для Gemini:</span>
          </div>
          <p className={cn('text-xs font-mono', isDark ? 'text-slate-400' : 'text-slate-600')}>
            "Parse this bank statement and extract all transactions. Categorize them into: income, office, payroll, taxes, transfer, other. For each transaction, provide date, counterparty, description, type, and amount."
          </p>
        </div>
      </div>

      {parsed && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn(
              'p-6 rounded-2xl border flex items-center justify-between bg-gradient-to-br',
              isDark ? 'from-emerald-500/10 to-slate-800 border-emerald-500/20' : 'from-emerald-50 to-white border-emerald-100'
            )}>
              <div>
                <p className={cn('text-sm font-medium mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.totalIncomingTrans}</p>
                <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncoming)}</h4>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className={cn(
              'p-6 rounded-2xl border flex items-center justify-between bg-gradient-to-br',
              isDark ? 'from-red-500/10 to-slate-800 border-red-500/20' : 'from-red-50 to-white border-red-100'
            )}>
              <div>
                <p className={cn('text-sm font-medium mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.totalOutgoingTrans}</p>
                <h4 className="text-2xl font-bold text-red-600">{formatCurrency(totalOutgoing)}</h4>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>{t.netFlow}</p>
              <h4 className={cn('text-xl font-bold', totalIncoming - totalOutgoing >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {formatCurrency(totalIncoming - totalOutgoing)}
              </h4>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Все' },
              { id: 'income', label: 'Доходы' },
              { id: 'payroll', label: 'Зарплаты' },
              { id: 'office', label: 'Офис/Аренда' },
              { id: 'taxes', label: 'Налоги' },
              { id: 'transfer', label: 'Переводы' },
              { id: 'other', label: 'Прочее' }
            ].map((btn: any) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  filter === btn.id
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div className={cn(
            'rounded-2xl border overflow-hidden',
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          )}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn('border-b text-left', isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50')}>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Контрагент / Описание</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Категория</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredTransactions.map((tx: any, idx: number) => (
                    <tr key={idx} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{tx.counterparty || tx.employeeName}</p>
                        <p className={cn('text-xs truncate max-w-md', isDark ? 'text-slate-400' : 'text-slate-500')}>{tx.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', getCategoryColor(tx.type))}>
                          {getCategoryLabel(tx.type)}
                        </span>
                      </td>
                      <td className={cn('px-6 py-4 text-sm font-semibold text-right whitespace-nowrap', tx.type === 'income' ? 'text-emerald-500' : 'text-red-500')}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>Нет транзакций в этой категории</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Document Generator Module
function DocumentGeneratorModule({ t, isDark }: any) {
  const [docType, setDocType] = useState<'invoice' | 'act'>('invoice');
  const [docLang, setDocLang] = useState<'ru' | 'en' | 'kz'>('ru');
  const [data, setData] = useState({
    number: '001',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientBin: '',
    items: [{ desc: '', qty: 1, price: 0 }],
    basis: '',
    providerName: 'BusinessZhumashBank LLC',
    providerBin: '123456789012'
  });

  const addItem = () => setData({ ...data, items: [...data.items, { desc: '', qty: 1, price: 0 }] });

  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...data.items];
    (newItems[idx] as any)[field] = value;
    setData({ ...data, items: newItems });
  };

  const generatePDF = async () => {
    // In a real scenario, we'd use jspdf here.
    // Since I can't run npm install, I'll alert the user and show a mock success.
    alert(`Генерация PDF (${docType}) на языке ${docLang}...\nПожалуйста, убедитесь, что вы запустили 'npm install jspdf jspdf-autotable'`);
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Vertical */}
          <div className="w-full md:w-64 space-y-4">
            <h3 className="font-bold text-lg mb-4">{t.generateNewDoc}</h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">{t.docTypeContract || 'Тип документа'}</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setDocType('invoice')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all text-left',
                    docType === 'invoice' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-slate-700 text-slate-400'
                  )}
                >
                  {t.invoiceForPayment}
                </button>
                <button
                  onClick={() => setDocType('act')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all text-left',
                    docType === 'act' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-slate-700 text-slate-400'
                  )}
                >
                  {t.actOfWork}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">{t.docLanguage}</label>
              <select
                value={docLang}
                onChange={(e: any) => setDocLang(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border outline-none text-sm',
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                )}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="kz">Қазақша</option>
              </select>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-6 border-l pl-0 md:pl-6 border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.clientRequisites}</label>
                <input
                  placeholder={t.fullName}
                  value={data.clientName}
                  onChange={(e) => setData({ ...data, clientName: e.target.value })}
                  className={cn('w-full px-4 py-2 rounded-xl border', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                />
                <input
                  placeholder={t.iinBin}
                  value={data.clientBin}
                  onChange={(e) => setData({ ...data, clientBin: e.target.value })}
                  className={cn('w-full px-4 py-2 rounded-xl border', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Шифр/Номер и Дата</label>
                <div className="flex gap-2">
                  <input
                    value={data.number}
                    onChange={(e) => setData({ ...data, number: e.target.value })}
                    className={cn('w-20 px-4 py-2 rounded-xl border', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                  />
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData({ ...data, date: e.target.value })}
                    className={cn('flex-1 px-4 py-2 rounded-xl border', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                  />
                </div>
                <input
                  placeholder={t.invoiceBasis}
                  value={data.basis}
                  onChange={(e) => setData({ ...data, basis: e.target.value })}
                  className={cn('w-full px-4 py-2 rounded-xl border', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t.serviceList}</label>
                <button onClick={addItem} className="text-xs text-blue-500 font-bold hover:underline">
                  {t.addItem}
                </button>
              </div>
              <div className="space-y-2">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 flex-wrap md:flex-nowrap">
                    <input
                      placeholder={t.itemDescription}
                      value={item.desc}
                      onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                      className={cn('flex-1 px-4 py-2 rounded-xl border text-sm', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                    />
                    <input
                      type="number"
                      placeholder={t.quantity}
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                      className={cn('w-20 px-4 py-2 rounded-xl border text-sm', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                    />
                    <input
                      type="number"
                      placeholder={t.pricePerUnit}
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', parseInt(e.target.value) || 0)}
                      className={cn('w-32 px-4 py-2 rounded-xl border text-sm', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">{t.totalWithVat}</p>
                <p className="text-2xl font-bold">
                  ₸{data.items.reduce((sum, it) => sum + (it.qty * it.price), 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <Download className="w-5 h-5" />
                {t.downloadPdf}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Documents Module (updated to show analysis)
function DocumentsModule({ t, isDark, documents, setDocuments }: any) {
  const [filter, setFilter] = useState('all');
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const filteredDocs = documents.filter((doc: any) => {
    if (filter === 'all') return true;
    return doc.type === filter;
  });

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'other');
      const newDoc = await documentsApi.upload(formData);
      setDocuments([newDoc, ...documents]);
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Ошибка при загрузке документа');
    } finally {
      setUploading(false);
    }
  };

  const analyzeDoc = async (docId: string) => {
    setAnalyzing(docId);
    try {
      const result = await aiApi.analyzeContract({ documentId: docId });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Ошибка при анализе документа');
    } finally {
      setAnalyzing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return FileText;
      case 'invoice': return Receipt;
      case 'receipt': return Receipt;
      case 'report': return FileSearch;
      case 'statement': return Building2;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'blue';
      case 'invoice': return 'emerald';
      case 'receipt': return 'orange';
      case 'report': return 'purple';
      case 'statement': return 'teal';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Analysis Result Modal */}
      {analysisResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            'w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95',
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'
          )}>
            <div className="p-6 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-bold">{t.riskDeepAnalysis}</h3>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="space-y-4">
                <div className={cn('p-4 rounded-2xl', isDark ? 'bg-slate-900/50' : 'bg-slate-50')}>
                  <h4 className="font-bold text-purple-500 flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" /> {t.docTypeContract}
                  </h4>
                  <p className="text-sm">{analysisResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">{t.keyTerms}</h5>
                    <ul className="text-sm space-y-1">
                      {analysisResult.keyTerms.map((t: string, i: number) => <li key={i} className="flex gap-2">• {t}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">{t.risks}</h5>
                    <ul className="text-sm space-y-1">
                      {analysisResult.risks.map((t: string, i: number) => <li key={i} className="flex gap-2 text-red-400">• {t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-slate-700 flex justify-end">
              <button onClick={() => setAnalysisResult(null)} className="px-6 py-2 bg-slate-700 text-white rounded-xl font-bold">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Upload */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: t.all },
            { id: 'contract', label: t.contracts },
            { id: 'invoice', label: t.invoices },
            { id: 'receipt', label: t.receipts },
            { id: 'report', label: t.reports },
            { id: 'statement', label: t.statements },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-xl font-medium text-sm transition-all',
                filter === f.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="file"
            id="doc-upload"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label
            htmlFor="doc-upload"
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all cursor-pointer',
              uploading && 'opacity-50 cursor-wait'
            )}
          >
            {uploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {uploading ? t.loading : t.uploadDocument}
          </label>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc: any) => {
          const Icon = getTypeIcon(doc.type);
          const color = getTypeColor(doc.type);

          return (
            <div
              key={doc.id}
              className={cn(
                'p-5 rounded-2xl border transition-all hover:shadow-lg',
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  'p-3 rounded-xl',
                  color === 'blue' && 'bg-blue-500/10 text-blue-500',
                  color === 'emerald' && 'bg-emerald-500/10 text-emerald-500',
                  color === 'orange' && 'bg-orange-500/10 text-orange-500',
                  color === 'purple' && 'bg-purple-500/10 text-purple-500',
                  color === 'teal' && 'bg-teal-500/10 text-teal-500'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  isDark ? 'bg-slate-700' : 'bg-slate-100'
                )}>
                  {doc.fileSize}
                </span>
              </div>

              <h4 className="font-medium mb-1 line-clamp-2">{doc.name}</h4>
              <p className={cn('text-sm mb-4', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {doc.uploadedAt}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (doc.file_path?.startsWith('http')) {
                      window.open(doc.file_path, '_blank');
                    } else {
                      window.open(`${BASE_URL}/uploads/${doc.file_path}`, '_blank');
                    }
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium transition-colors',
                    isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'
                  )}
                >
                  <Eye className="w-4 h-4" />
                  {t.view}
                </button>
                <button
                  onClick={() => analyzeDoc(doc.id)}
                  disabled={analyzing === doc.id}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium transition-colors',
                    analyzing === doc.id
                      ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                      : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
                  )}
                >
                  <Sparkles className={cn('w-4 h-4', analyzing === doc.id && 'animate-pulse')} />
                  {analyzing === doc.id ? '...' : t.aiAnalyze}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Multi-Bank Module
function MultiBankModule({ t, isDark, bankAccounts, formatCurrency, displayCurrency, convertToDisplayCurrency, setShowAddBank }: any) {
  const totalInDisplay = bankAccounts.reduce((sum: number, acc: any) => {
    return sum + convertToDisplayCurrency(acc.balance, acc.currency);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className={cn(
        'p-8 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white relative overflow-hidden'
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <p className="text-white/80 mb-2">{t.totalBalanceAllBanks || 'Общий баланс во всех банках'}</p>
          <h2 className="text-4xl font-bold mb-1">
            {formatCurrency(totalInDisplay, displayCurrency)}
          </h2>
          <p className="text-sm text-white/60">
            {bankAccounts.length} {t.bankAccountsCount || 'банковских счетов'} • {t.displayedIn || 'Отображается в'} {displayCurrency}
          </p>
        </div>
      </div>

      {/* Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts.map((account: any) => (
          <div
            key={account.id}
            className={cn(
              'p-6 rounded-2xl border transition-all hover:shadow-lg',
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: account.color }}
                >
                  {account.bankName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold">{account.bankName}</h4>
                  <p className={cn('text-sm font-mono', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {account.accountNumber.slice(0, 8)}...{account.accountNumber.slice(-4)}
                  </p>
                </div>
              </div>
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                isDark ? 'bg-slate-700' : 'bg-slate-100'
              )}>
                {account.currency}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className={cn('text-sm mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {t.balance}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm mb-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  В {displayCurrency}
                </p>
                <p className={cn('text-lg font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>
                  ≈ {formatCurrency(convertToDisplayCurrency(account.balance, account.currency), displayCurrency)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button className={cn(
                'text-sm font-medium flex items-center gap-1',
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              )}>
                <ArrowLeftRight className="w-4 h-4" />
                {t.viewTransactions || 'Посмотреть операции'}
              </button>
              <button className={cn(
                'text-sm font-medium flex items-center gap-1',
                'text-emerald-500 hover:text-emerald-600'
              )}>
                <RefreshCw className="w-4 h-4" />
                Обновить
              </button>
            </div>
          </div>
        ))}

        {/* Add Bank Card */}
        <div
          onClick={() => setShowAddBank(true)}
          className={cn(
            'p-6 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
            isDark
              ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          )}
        >
          <div className="text-center">
            <div className={cn(
              'w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center',
              isDark ? 'bg-slate-700' : 'bg-slate-100'
            )}>
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium">{t.addBankAccount}</p>
            <p className={cn('text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
              {t.multiBankSub}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exchange Module
function ExchangeModule({ t, isDark, exchangeRates, language }: any) {
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [offices, setOffices] = useState<any[]>([]);
  const [city, setCity] = useState('Almaty');

  if (!exchangeRates) {
    return (
      <div className="p-6 text-center text-slate-500">
        Загрузка данных обмена валют...
      </div>
    );
  }

  useEffect(() => {
    detectLocationManual('Almaty');
  }, []);

  const detectLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        // In reality, we'd use reverse geocoding to get city name
        // For now, we'll simulate finding Astana if someone's coordinates match a rough range
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('Detected coords:', lat, lng);

        // Simple mock: if lat is near Astana (rough 51.1 deg)
        const isNearAstana = Math.abs(lat - 51.1694) < 2;
        const detectedCity = isNearAstana ? 'Astana' : 'Almaty';
        setCity(detectedCity);

        try {
          const results = await exchangeApi.offices(detectedCity);
          setOffices(results.offices || []);
          setLocated(true);
        } catch (err) {
          console.error('Error fetching offices:', err);
        } finally {
          setLocating(false);
        }
      }, (error) => {
        console.warn('Geolocation failed:', error);
        setLocating(false);
        // Fallback to Almaty
        detectLocationManual('Almaty');
      });
    } else {
      setLocating(false);
    }
  };

  const detectLocationManual = async (manualCity: string) => {
    setLocating(true);
    try {
      // manualCity is 'Almaty' or 'Astana'
      const results = await exchangeApi.offices(manualCity);
      setOffices(results.offices || []);
      setCity(manualCity);
      setLocated(true);
    } catch (err) {
      console.error('Error fetching offices:', err);
    } finally {
      setLocating(false);
    }
  };

  const [sortBy, setSortBy] = useState<'distance' | 'usd' | 'eur'>('distance');
  const [showAll, setShowAll] = useState(false);

  const sortedOffices = [...offices].sort((a, b) => {
    if (sortBy === 'distance') return a.numericDistance - b.numericDistance;
    if (sortBy === 'usd') return b.rates.usdBuy - a.rates.usdBuy;
    if (sortBy === 'eur') return b.rates.eurBuy - a.rates.eurBuy;
    return 0;
  });

  const displayedOffices = showAll ? sortedOffices : sortedOffices.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ... (Kurs.kz Informer remains same) ... */}
      <div className={cn(
        'p-6 rounded-2xl border overflow-hidden relative',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-bold">Kurs.kz Live Data</h3>
          </div>
          <a
            href="https://kurs.kz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1"
          >
            {t.viewOnKursKz} <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="w-full flex justify-center">
          <iframe
            src="https://kurs.kz/informers/informer_frame.php"
            width="240"
            height="350"
            frameBorder="no"
            scrolling="no"
            className="rounded-xl shadow-inner bg-white"
          ></iframe>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-500/5 text-xs text-center italic text-slate-400">
          * {t.exchangeSub}
        </div>
      </div>

      {/* Official Rates ... (No changes needed in this block) ... */}
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t.liveRates}</h3>
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            {t.lastUpdated}: {new Date(exchangeRates.lastUpdated).toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { currency: 'USD', rate: exchangeRates.usdKzt, flag: '🇺🇸', name: 'US Dollar' },
            { currency: 'EUR', rate: exchangeRates.eurKzt, flag: '🇪🇺', name: 'Euro' },
            { currency: 'RUB', rate: exchangeRates.rubKzt, flag: '🇷🇺', name: 'Ruble' },
          ].map((item) => (
            <div key={item.currency} className={cn(
              'p-4 rounded-xl',
              isDark ? 'bg-slate-700/50' : 'bg-slate-50'
            )}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{item.flag}</span>
                <div>
                  <p className="font-semibold">{item.currency}/KZT</p>
                  <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{item.name}</p>
                </div>
              </div>
              <p className="text-2xl font-bold">₸{item.rate?.toFixed(2) || '0.00'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Exchangers */}
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t.nearbyExchanges}</h3>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {located ? `${offices.length} ${t.exchangersInCity} ${city}` : t.geolocationAccess}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Controls */}
            {located && (
              <div className={cn(
                'flex items-center p-1 rounded-xl border text-xs font-medium',
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
              )}>
                <button
                  onClick={() => setSortBy('distance')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    sortBy === 'distance' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {t.nearest}
                </button>
                <button
                  onClick={() => setSortBy('usd')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    sortBy === 'usd' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  USD
                </button>
                <button
                  onClick={() => setSortBy('eur')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all',
                    sortBy === 'eur' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  EUR
                </button>
              </div>
            )}

            <div className={cn(
              'flex items-center p-1 rounded-xl border text-xs font-medium',
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
            )}>
              <button
                onClick={() => detectLocationManual('Almaty')}
                className={cn(
                  'px-4 py-1.5 rounded-lg transition-all',
                  city === 'Almaty' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {language === 'kz' ? 'Алматы' : language === 'en' ? 'Almaty' : 'Алматы'}
              </button>
              <button
                onClick={() => detectLocationManual('Astana')}
                className={cn(
                  'px-4 py-1.5 rounded-lg transition-all',
                  city === 'Astana' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {language === 'kz' ? 'Астана' : language === 'en' ? 'Astana' : 'Астана'}
              </button>
            </div>

            <button
              onClick={detectLocation}
              disabled={locating}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all',
                locating
                  ? 'bg-blue-500/20 text-blue-400 cursor-wait'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              )}
            >
              {locating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {t.locationDetected || 'Определить локацию'}
            </button>
          </div>
        </div>

        {located && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {displayedOffices.map((office) => (
                <div
                  key={office.id}
                  className={cn(
                    'p-4 rounded-xl transition-all border',
                    isDark ? 'bg-slate-700/30 border-slate-700 hover:bg-slate-700/50' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                        (office.id % 2 === 0) ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                      )}>
                        {office.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{office.name}</h4>
                        <p className={cn('text-sm flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                          <MapPin className="w-3 h-3 text-red-500" />
                          {office.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold leading-none',
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border shadow-sm'
                      )}>
                        {office.distance}
                      </span>
                      <p className={cn('text-[10px] mt-1.5 font-medium flex items-center justify-end gap-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        <Clock className="w-3 h-3" />
                        {office.updatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className={cn(
                      'p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-center border',
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                    )}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">USD</p>
                      <div className="flex flex-col xl:flex-row items-center justify-center gap-0 xl:gap-2 text-[11px] sm:text-sm font-semibold">
                        <span className="text-emerald-500">{office.rates.usdBuy}</span>
                        <span className="text-slate-300 hidden xl:block">|</span>
                        <span className="text-red-400">{office.rates.usdSell}</span>
                      </div>
                    </div>
                    <div className={cn(
                      'p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-center border',
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                    )}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">EUR</p>
                      <div className="flex flex-col xl:flex-row items-center justify-center gap-0 xl:gap-2 text-[11px] sm:text-sm font-semibold">
                        <span className="text-emerald-500">{office.rates.eurBuy}</span>
                        <span className="text-slate-300 hidden xl:block">|</span>
                        <span className="text-red-400">{office.rates.eurSell}</span>
                      </div>
                    </div>
                    <div className={cn(
                      'p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-center border',
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                    )}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">RUB</p>
                      <div className="flex flex-col xl:flex-row items-center justify-center gap-0 xl:gap-2 text-[11px] sm:text-sm font-semibold">
                        <span className="text-emerald-500">{office.rates.rubBuy}</span>
                        <span className="text-slate-300 hidden xl:block">|</span>
                        <span className="text-red-400">{office.rates.rubSell}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {offices.length > 8 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className={cn(
                  'w-full py-5 rounded-2xl font-bold transition-all border-2 border-dashed flex items-center justify-center gap-3',
                  isDark
                    ? 'border-blue-500/30 text-blue-400 hover:border-blue-500 hover:text-white hover:bg-blue-500/10'
                    : 'border-blue-200 text-blue-500 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
                )}
              >
                {showAll ? (
                  <>
                    <X className="w-5 h-5" />
                    {t.showLess}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {t.showMore} ({offices.length - 8} {t.exchangersInCity})
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Currency Converter */}
      <div className={cn(
        'p-6 rounded-2xl border',
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        <h3 className="text-lg font-semibold mb-4">Конвертер валют</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Сумма</label>
            <input
              type="number"
              defaultValue={1000}
              className={cn(
                'w-full px-4 py-3 rounded-xl border outline-none',
                isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
              )}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Из</label>
            <select className={cn(
              'w-full px-4 py-3 rounded-xl border outline-none',
              isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
            )}>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>RUB (₽)</option>
              <option>KZT (₸)</option>
            </select>
          </div>
          <div className="pt-7">
            <ArrowLeftRight className="w-6 h-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">В</label>
            <select className={cn(
              'w-full px-4 py-3 rounded-xl border outline-none',
              isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
            )}>
              <option>KZT (₸)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>RUB (₽)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Результат</label>
            <div className={cn(
              'px-4 py-3 rounded-xl font-bold text-emerald-500',
              isDark ? 'bg-slate-700' : 'bg-slate-100'
            )}>
              ₸{exchangeRates?.usdKzt?.toLocaleString() || '450,250'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
