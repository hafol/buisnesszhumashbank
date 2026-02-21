// Core Types for BusinessZhumashBank

export interface User {
  id: string;
  name: string;
  email: string;
  business_type: 'IP' | 'TOO'; // ИП or ТОО
  iin: string;
  bin?: string;
  company?: string;
  registrationDate: string;
  role?: 'user' | 'developer';
  subscription_end_date?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankLogo?: string;
  accountNumber: string;
  balance: number;
  currency: 'KZT' | 'USD' | 'EUR' | 'RUB';
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  totalCost: number;
  contractor: Contractor;
  documents: Document[];
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface Contractor {
  name: string;
  iinBin: string;
  phone: string;
  email: string;
  address?: string;
}

export interface Milestone {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'report' | 'statement';
  uploadedAt: string;
  fileSize: string;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  summary: string;
  keyTerms: string[];
  obligations: string[];
  risks: string[];
  deadlines: { description: string; date: string }[];
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  customerName: string;
  customerIin?: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  sellerInfo: {
    name: string;
    iinBin: string;
    address: string;
  };
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TaxCalculation {
  period: string;
  totalIncome: number;
  taxRate: number;
  taxAmount: number;
  socialTax: number;
  pensionContribution: number;
  medicalInsurance: number;
  totalPayable: number;
  declarations: TaxDeclaration[];
  paymentDetails: PaymentDetails;
}

export interface TaxDeclaration {
  formNumber: string;
  name: string;
  deadline: string;
  whereToFile: string;
  status: 'pending' | 'filed' | 'overdue';
}

export interface PaymentDetails {
  recipient: string;
  bankName: string;
  iik: string;
  bin: string;
  kbe: string;
  knp: string;
}

export interface PayrollTransaction {
  id: string;
  date: string;
  employeeName: string;
  amount: number;
  type: 'salary' | 'bonus' | 'advance';
  description: string;
}

export interface ExchangeOffice {
  id: string;
  name: string;
  address: string;
  distance: string;
  rates: {
    usdBuy: number;
    usdSell: number;
    eurBuy: number;
    eurSell: number;
    rubBuy: number;
    rubSell: number;
  };
  updatedAt: string;
}

export interface ExchangeRates {
  usdKzt: number;
  eurKzt: number;
  rubKzt: number;
  lastUpdated: string;
}

export type Language = 'ru' | 'en' | 'kz';
export type Theme = 'light' | 'dark';
export type Currency = 'KZT' | 'USD' | 'EUR' | 'RUB';
