export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';

export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface PlanConfig {
  id: string;
  type: PlanType;
  nameAr: string;
  nameEn: string;
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  maxStudents: number;
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
}

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  plan: PlanType;
  status: TenantStatus;
  billingCycle: BillingCycle;
  studentCount: number;
  userCount: number;
  createdAt: string;
  renewDate: string;
}

export interface BankReceiptData {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: PlanType;
  amount: number;
  currency: string;
  senderName: string;
  senderBank: string;
  referenceNumber: string;
  receiptUrl: string;
  status: ReceiptStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface PlatformConfig {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultTimezone: string;
  logoUrl?: string;
  maintenanceMode: boolean;
}

export interface PaymentGatewaysConfig {
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
}

export interface SuperAdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  lastLogin?: string;
}
