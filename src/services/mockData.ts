// Mock Data for BusinessZhumashBank
import type { 
  User, BankAccount, Project, Document, Receipt, 
  TaxCalculation, PayrollTransaction, ExchangeOffice, ExchangeRates 
} from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Асхат Жумашев',
  email: 'ashat@businesszhumash.kz',
  businessType: 'IP',
  iin: '850101350789',
  company: 'ИП Жумашев А.К.',
  registrationDate: '2020-03-15'
};

export const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    bankName: 'Kaspi Bank',
    accountNumber: 'KZ12345678901234567890',
    balance: 2450000,
    currency: 'KZT',
    color: '#FF0000'
  },
  {
    id: '2',
    bankName: 'Freedom Bank',
    accountNumber: 'KZ98765432109876543210',
    balance: 5200,
    currency: 'USD',
    color: '#00C853'
  },
  {
    id: '3',
    bankName: 'Halyk Bank',
    accountNumber: 'KZ11223344556677889900',
    balance: 890000,
    currency: 'KZT',
    color: '#00BCD4'
  },
  {
    id: '4',
    bankName: 'Jusan Bank',
    accountNumber: 'KZ55667788990011223344',
    balance: 1500,
    currency: 'EUR',
    color: '#9C27B0'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Ремонт офиса',
    description: 'Капитальный ремонт офисного помещения на ул. Абая 150',
    totalCost: 1200000,
    contractor: {
      name: 'ТОО "СтройМастер"',
      iinBin: '180340012345',
      phone: '+7 777 123 4567',
      email: 'info@stroymaster.kz',
      address: 'г. Алматы, ул. Толе би 59'
    },
    documents: [
      {
        id: 'd1',
        name: 'Договор подряда №45-2024',
        type: 'contract',
        uploadedAt: '2024-01-15',
        fileSize: '245 KB',
        aiAnalysis: {
          summary: 'Договор на выполнение ремонтных работ сроком 3 месяца. Общая стоимость 1,200,000 тенге с поэтапной оплатой.',
          keyTerms: ['Срок выполнения: 90 дней', 'Гарантия: 24 месяца', 'Материалы за счёт подрядчика'],
          obligations: ['Еженедельные отчёты о ходе работ', 'Согласование изменений в письменной форме'],
          risks: ['Штраф за просрочку 0.1% в день', 'Отсутствие форс-мажорных оговорок'],
          deadlines: [
            { description: 'Начало работ', date: '2024-02-01' },
            { description: 'Завершение работ', date: '2024-05-01' }
          ]
        }
      }
    ],
    milestones: [
      { id: 'm1', description: 'Аванс - начало работ', amount: 300000, dueDate: '2024-02-01', status: 'paid' },
      { id: 'm2', description: 'После завершения потолков', amount: 400000, dueDate: '2024-03-01', status: 'paid' },
      { id: 'm3', description: 'После отделки стен', amount: 300000, dueDate: '2024-04-01', status: 'pending' },
      { id: 'm4', description: 'Финальная оплата - сдача объекта', amount: 200000, dueDate: '2024-05-01', status: 'pending' }
    ],
    status: 'active',
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Закупка оборудования',
    description: 'Покупка компьютерной техники для офиса',
    totalCost: 850000,
    contractor: {
      name: 'ТОО "ТехноМир"',
      iinBin: '190540098765',
      phone: '+7 701 987 6543',
      email: 'sales@technomir.kz'
    },
    documents: [],
    milestones: [
      { id: 'm1', description: 'Полная предоплата', amount: 850000, dueDate: '2024-02-15', status: 'paid' }
    ],
    status: 'completed',
    createdAt: '2024-02-10'
  }
];

export const mockDocuments: Document[] = [
  { id: '1', name: 'Договор аренды офиса.pdf', type: 'contract', uploadedAt: '2024-01-05', fileSize: '312 KB' },
  { id: '2', name: 'Счёт-фактура №123.pdf', type: 'invoice', uploadedAt: '2024-02-10', fileSize: '156 KB' },
  { id: '3', name: 'Акт выполненных работ.pdf', type: 'report', uploadedAt: '2024-02-20', fileSize: '89 KB' },
  { id: '4', name: 'Выписка Kaspi Jan-2024.pdf', type: 'statement', uploadedAt: '2024-02-01', fileSize: '445 KB' },
  { id: '5', name: 'Чек №0001.pdf', type: 'receipt', uploadedAt: '2024-02-25', fileSize: '45 KB' },
];

export const mockReceipts: Receipt[] = [
  {
    id: '1',
    receiptNumber: '0001',
    date: '2024-02-25',
    customerName: 'ТОО "АльфаТрейд"',
    customerIin: '190850012345',
    items: [
      { description: 'Консультационные услуги', quantity: 10, unitPrice: 15000, total: 150000 },
      { description: 'Подготовка документации', quantity: 1, unitPrice: 50000, total: 50000 }
    ],
    total: 200000,
    paymentMethod: 'transfer',
    sellerInfo: {
      name: 'ИП Жумашев А.К.',
      iinBin: '850101350789',
      address: 'г. Алматы, ул. Абая 150'
    }
  }
];

export const mockTaxCalculation: TaxCalculation = {
  period: 'Q1 2024',
  totalIncome: 3500000,
  taxRate: 3,
  taxAmount: 105000,
  socialTax: 17500,
  pensionContribution: 35000,
  medicalInsurance: 17500,
  totalPayable: 175000,
  declarations: [
    {
      formNumber: '910.00',
      name: 'Упрощённая декларация для ИП',
      deadline: '2024-04-15',
      whereToFile: 'Кабинет налогоплательщика (cabinet.salyk.kz)',
      status: 'pending'
    },
    {
      formNumber: '200.00',
      name: 'Декларация по ИПН и СН',
      deadline: '2024-04-25',
      whereToFile: 'Кабинет налогоплательщика (cabinet.salyk.kz)',
      status: 'pending'
    }
  ],
  paymentDetails: {
    recipient: 'УГД по г. Алматы',
    bankName: 'Национальный Банк РК',
    iik: 'KZ24070105KSN0000000',
    bin: '000000000000',
    kbe: '11',
    knp: '911'
  }
};

export const mockPayrollTransactions: PayrollTransaction[] = [
  { id: '1', date: '2024-02-05', employeeName: 'Иванов Пётр', amount: 350000, type: 'salary', description: 'Зарплата за январь 2024' },
  { id: '2', date: '2024-02-05', employeeName: 'Сергеева Анна', amount: 280000, type: 'salary', description: 'Зарплата за январь 2024' },
  { id: '3', date: '2024-02-05', employeeName: 'Ким Александр', amount: 420000, type: 'salary', description: 'Зарплата за январь 2024' },
  { id: '4', date: '2024-02-10', employeeName: 'Иванов Пётр', amount: 50000, type: 'bonus', description: 'Премия за проект' },
  { id: '5', date: '2024-02-20', employeeName: 'Сергеева Анна', amount: 100000, type: 'advance', description: 'Аванс февраль 2024' },
];

export const mockExchangeOffices: ExchangeOffice[] = [
  {
    id: '1',
    name: 'Обменный пункт "Астана"',
    address: 'ул. Кунаева 12, Астана',
    distance: '0.3 км',
    rates: { usdBuy: 448.50, usdSell: 451.20, eurBuy: 485.30, eurSell: 489.50, rubBuy: 4.85, rubSell: 5.05 },
    updatedAt: '10 мин назад'
  },
  {
    id: '2',
    name: 'Обменник "Центральный"',
    address: 'пр. Республики 45, Астана',
    distance: '0.7 км',
    rates: { usdBuy: 449.00, usdSell: 450.80, eurBuy: 486.00, eurSell: 488.90, rubBuy: 4.82, rubSell: 5.08 },
    updatedAt: '5 мин назад'
  },
  {
    id: '3',
    name: 'Kaspi Обмен',
    address: 'ул. Сыганак 77, Астана',
    distance: '1.2 км',
    rates: { usdBuy: 448.80, usdSell: 451.00, eurBuy: 485.50, eurSell: 489.20, rubBuy: 4.80, rubSell: 5.10 },
    updatedAt: '2 мин назад'
  },
  {
    id: '4',
    name: 'Freedom Exchange',
    address: 'ул. Достык 5, Астана',
    distance: '1.5 км',
    rates: { usdBuy: 449.20, usdSell: 450.50, eurBuy: 486.20, eurSell: 488.70, rubBuy: 4.83, rubSell: 5.07 },
    updatedAt: '15 мин назад'
  }
];

export const mockExchangeRates: ExchangeRates = {
  usdKzt: 450.25,
  eurKzt: 487.80,
  rubKzt: 4.95,
  lastUpdated: '2024-02-28T14:30:00'
};

// AI Prompts for Gemini API
export const aiPrompts = {
  contractAnalysis: `You are a legal document analyst specializing in Kazakhstan business law.
Analyze the following contract and provide:
1. A concise summary (2-3 sentences)
2. Key terms and conditions (bullet points)
3. Obligations for each party
4. Potential risks or unfavorable clauses
5. Important deadlines

Contract text:
{CONTRACT_TEXT}

Respond in Russian.`,

  taxCalculation: `You are an expert accountant specializing in Kazakhstan Tax Code (Налоговый кодекс РК).
Based on the following business information, calculate:

Business Type: {BUSINESS_TYPE} (ИП or ТОО)
Tax Regime: Simplified (Упрощённый режим)
Total Income for Period: {TOTAL_INCOME} KZT
Period: {PERIOD}

Calculate and provide:
1. Income tax (ИПН/КПН) - 3% for simplified regime
2. Social tax (Социальный налог)
3. Pension contributions (ОПВ) - 10%
4. Medical insurance (ОСМС) - 2%
5. Total amount payable

Also provide:
- Which tax declaration forms to file (e.g., 910.00)
- Filing deadlines
- Step-by-step payment instructions
- Payment requisites (КБК, БИН получателя)

Respond in Russian with exact amounts in KZT.`,

  payrollParsing: `You are a financial document parser specializing in bank statements.
Parse the following bank statement and extract ONLY payroll/salary related transactions.
Look for keywords: Зарплата, Заработная плата, ЗП, Salary, Payroll, Премия, Аванс, Bonus.

IGNORE all other transactions (purchases, transfers, payments, etc.)

Statement data:
{STATEMENT_DATA}

For each payroll transaction, extract:
- Date
- Employee name (if available)
- Amount
- Type (salary/bonus/advance)
- Description

Respond in JSON format.`,

  documentSummary: `Analyze this document and provide:
1. Document type
2. Key information summary
3. Important dates and deadlines
4. Financial amounts mentioned
5. Action items required

Document:
{DOCUMENT_TEXT}

Respond in Russian.`
};

// Monthly transaction data for charts
export const monthlyTransactionData = [
  { month: 'Янв', income: 1200000, expenses: 850000 },
  { month: 'Фев', income: 1450000, expenses: 920000 },
  { month: 'Мар', income: 980000, expenses: 750000 },
  { month: 'Апр', income: 1680000, expenses: 1100000 },
  { month: 'Май', income: 1320000, expenses: 890000 },
  { month: 'Июн', income: 1550000, expenses: 960000 },
];

export const expenseCategories = [
  { name: 'Зарплата', value: 45, color: '#3B82F6' },
  { name: 'Аренда', value: 20, color: '#10B981' },
  { name: 'Налоги', value: 15, color: '#F59E0B' },
  { name: 'Закупки', value: 12, color: '#8B5CF6' },
  { name: 'Прочее', value: 8, color: '#6B7280' },
];
