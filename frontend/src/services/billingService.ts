import api from './api';

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxStudents: number;
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
}

export interface TenantSubscriptionInfo {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PENDING_REVIEW' | 'SUSPENDED';
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    daysRemaining: number;
    isExpired: boolean;
    isPaywalled: boolean;
  };
  currentPlan: SubscriptionPlanItem | null;
  availablePlans: SubscriptionPlanItem[];
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    iban: string;
    swift: string;
    instructions: string;
  };
  recentSubscriptions: any[];
  recentReceipts: any[];
}

export interface BankReceiptPayload {
  planId: string;
  amount: number;
  currency?: string;
  senderName: string;
  senderBank?: string;
  transferRef?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface PayOnlinePayload {
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  paymentMethod?: string;
}

export interface TenantInvoiceItem {
  invoiceNumber: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  date: string;
  status: string;
  paymentMethod: string;
  paymentRef?: string;
}

export const billingService = {
  getMySubscription: async (): Promise<TenantSubscriptionInfo> => {
    const res = await api.get('/tenants/my-subscription');
    return res.data.data;
  },

  submitBankReceipt: async (payload: BankReceiptPayload) => {
    const res = await api.post('/tenants/my-subscription/bank-receipt', payload);
    return res.data;
  },

  payOnline: async (payload: PayOnlinePayload) => {
    const res = await api.post('/tenants/my-subscription/pay-online', payload);
    return res.data;
  },

  getInvoices: async (): Promise<TenantInvoiceItem[]> => {
    const res = await api.get('/tenants/my-subscription/invoices');
    return res.data.data;
  }
};
