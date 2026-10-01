export interface CreateTenantDto {
  name: string;
  slug: string;
  domain?: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName?: string;
}
