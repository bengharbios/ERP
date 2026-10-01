import { apiClient } from './api';

export interface SuperAdminOverview {
  mrr: number;
  activeTenants: number;
  totalTenants: number;
  totalStudents: number;
  realTursoStats: {
    students: number;
    users: number;
    leads: number;
    tablesCount: number;
    databaseProvider: string;
    connectionStatus: string;
  };
  pendingReceiptsCount: number;
  systemHealth: string;
  recentAlerts: Array<{
    id: string;
    type: string;
    title: string;
    desc: string;
    timestamp: string;
  }>;
}

export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  studentCount: number;
  userCount: number;
  createdAt: string;
  renewDate: string;
}

export interface BankReceiptItem {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  amount: number;
  currency: string;
  senderName: string;
  senderBank: string;
  referenceNumber: string;
  receiptUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface PlanItem {
  id: string;
  type: string;
  nameAr: string;
  nameEn: string;
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  maxStudents: number;
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
}

export interface PlatformSettingsData {
  platform: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    defaultCurrency: string;
    defaultTimezone: string;
    logoUrl?: string;
    maintenanceMode: boolean;
  };
  payment: {
    enableBankTransfer: boolean;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    iban: string;
    transferInstructions: string;
    enableOnlinePayment: boolean;
    onlineProvider: 'STRIPE' | 'MOYASAR' | 'TAP' | 'MYFATOORAH';
    isTestMode: boolean;
    publicKey?: string;
  };
  profile: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    twoFactorEnabled: boolean;
    lastLogin?: string;
  };
}

export const superAdminService = {
  getOverview: async () => {
    const res = await apiClient.get<SuperAdminOverview>('/superadmin/overview');
    return res.data;
  },

  getTenants: async () => {
    const res = await apiClient.get<TenantItem[]>('/superadmin/tenants');
    return res.data;
  },

  addTenant: async (data: Partial<TenantItem>) => {
    const res = await apiClient.post<TenantItem>('/superadmin/tenants', data);
    return res.data;
  },

  updateTenant: async (id: string, updates: Partial<TenantItem>) => {
    const res = await apiClient.patch<TenantItem>(`/superadmin/tenants/${id}`, updates);
    return res.data;
  },

  deleteTenant: async (id: string) => {
    const res = await apiClient.delete(`/superadmin/tenants/${id}`);
    return res.data;
  },

  getSubscriptions: async () => {
    const res = await apiClient.get<{
      tenants: TenantItem[];
      receipts: BankReceiptItem[];
      plans: PlanItem[];
    }>('/superadmin/subscriptions');
    return res.data;
  },

  reviewReceipt: async (id: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    const res = await apiClient.post<BankReceiptItem>(`/superadmin/receipts/${id}/review`, { status, note });
    return res.data;
  },

  getPlans: async () => {
    const res = await apiClient.get<PlanItem[]>('/superadmin/plans');
    return res.data;
  },

  updatePlans: async (plans: PlanItem[]) => {
    const res = await apiClient.put<PlanItem[]>('/superadmin/plans', { plans });
    return res.data;
  },

  getSettings: async () => {
    const res = await apiClient.get<PlatformSettingsData>('/superadmin/settings');
    return res.data;
  },

  updateSettings: async (settings: Partial<PlatformSettingsData>) => {
    const res = await apiClient.put<PlatformSettingsData>('/superadmin/settings', settings);
    return res.data;
  },

  impersonateTenant: async (tenantId: string): Promise<{
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      role: string;
      impersonated: boolean;
    };
    tenant: { id: string; name: string; slug: string };
  }> => {
    const res = await apiClient.post(`/superadmin/tenants/${tenantId}/impersonate`, {});
    return (res as any).data;
  },
};
