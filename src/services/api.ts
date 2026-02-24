// Frontend API service — all requests go through here
export const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://buisnesszhumashBank.onrender.com' : 'http://localhost:5000');

function getToken(): string | null {
    return localStorage.getItem('bzb_token');
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('bzb_token');
        window.location.href = '/';
        throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data as T;
}

// Auth
export const authApi = {
    register: (body: object) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<any>('/api/auth/me'),
    updateProfile: (body: object) => request<any>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

// Projects
export const projectsApi = {
    list: () => request<any[]>('/api/projects'),
    create: (body: object) => request<any>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/projects/${id}`, { method: 'DELETE' }),
    updateMilestone: (id: string, status: string) =>
        request<any>(`/api/projects/milestones/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Receipts
export const receiptsApi = {
    list: () => request<any[]>('/api/receipts'),
    create: (body: object) => request<any>('/api/receipts', { method: 'POST', body: JSON.stringify(body) }),
};

// Documents
export const documentsApi = {
    list: () => request<any[]>('/api/documents'),
    upload: (formData: FormData) => request<any>('/api/documents/upload', { method: 'POST', body: formData }),
    analyze: (id: string) => request<any>(`/api/documents/${id}/analyze`, { method: 'POST' }),
    delete: (id: string) => request<any>(`/api/documents/${id}`, { method: 'DELETE' }),
};

// Bank Accounts
export const bankAccountsApi = {
    list: () => request<any[]>('/api/bank-accounts'),
    create: (body: object) => request<any>('/api/bank-accounts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/api/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/bank-accounts/${id}`, { method: 'DELETE' }),
};

// AI
export const aiApi = {
    calculateTaxes: (body: object) => request<any>('/api/ai/calculate-taxes', { method: 'POST', body: JSON.stringify(body) }),
    analyzeContract: (body: object) => request<any>('/api/ai/analyze-contract', { method: 'POST', body: JSON.stringify(body) }),
    parsePayroll: (formData: FormData) => request<any>('/api/ai/parse-payroll', { method: 'POST', body: formData }),
    payrollHistory: () => request<any[]>('/api/ai/payroll-history'),
    taxChat: (body: object) => request<any>('/api/ai/tax-chat', { method: 'POST', body: JSON.stringify(body) }),
};

// Exchange
export const exchangeApi = {
    rates: () => request<any>('/api/exchange/rates'),
    offices: (city?: string) => request<any>(`/api/exchange/offices${city ? `?city=${city}` : ''}`),
};

// Payments
export const paymentsApi = {
    plans: () => request<any[]>('/api/payments/plans'),
    createCheckout: (plan: string) => request<any>('/api/payments/create-checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
    subscription: () => request<any>('/api/payments/subscription'),
};

// Businesses
export const businessesApi = {
    list: () => request<any[]>('/api/businesses'),
    create: (body: object) => request<any>('/api/businesses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>(`/api/businesses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/api/businesses/${id}`, { method: 'DELETE' }),
};

// Business Transactions
export const businessTxApi = {
    list: (businessId: string) => request<any[]>(`/api/businesses/${businessId}/transactions`),
    create: (businessId: string, body: object) => request<any>(`/api/businesses/${businessId}/transactions`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (businessId: string, txId: string) => request<any>(`/api/businesses/${businessId}/transactions/${txId}`, { method: 'DELETE' }),
};

// Business AI
export const businessAiApi = {
    getHistory: (businessId: string) => request<any[]>(`/api/businesses/${businessId}/ai/history`),
    sendMessage: (businessId: string, message: string) => request<any>(`/api/businesses/${businessId}/ai/chat`, { method: 'POST', body: JSON.stringify({ message }) }),
    clearHistory: (businessId: string) => request<any>(`/api/businesses/${businessId}/ai/history`, { method: 'DELETE' }),
};

