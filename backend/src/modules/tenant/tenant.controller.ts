import { Request, Response } from "express";
import { AuthRequest } from "../../common/utils/jwt";
import { TenantService } from "./tenant.service";

const tenantService = new TenantService();

export class TenantController {
  async createTenant(req: Request, res: Response) {
    try {
      const { name, slug, domain, adminEmail, adminPassword, adminFullName } = req.body;
      
      if (!name || !slug || !adminEmail || !adminPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await tenantService.createTenantWithAdmin({
        name,
        slug,
        domain,
        adminEmail,
        adminPassword,
        adminFullName
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      return res.status(500).json({ error: error.message || "Failed to create tenant" });
    }
  }

  async getAllTenants(_req: Request, res: Response) {
    try {
      const tenants = await tenantService.getAllTenants();
      return res.status(200).json({ success: true, data: tenants });
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      return res.status(500).json({ error: "Failed to fetch tenants" });
    }
  }

  async getMyStats(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || 'tenant_primary_001';
      const stats = await tenantService.getTenantStats(tenantId);
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Error fetching tenant stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }

  async getMySubscription(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || 'tenant_primary_001';
      const data = await tenantService.getTenantSubscription(tenantId);
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch subscription" });
    }
  }

  async submitBankReceipt(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || 'tenant_primary_001';
      const { planId, amount, currency, senderName, senderBank, transferRef, receiptUrl, notes } = req.body;
      
      if (!amount || !senderName) {
        return res.status(400).json({ error: "المبلغ واسم المحوّل مطلوبان" });
      }

      const result = await tenantService.submitBankReceipt(tenantId, {
        planId,
        amount: Number(amount),
        currency,
        senderName,
        senderBank,
        transferRef,
        receiptUrl,
        notes
      });
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error submitting bank receipt:", error);
      return res.status(500).json({ error: error.message || "Failed to submit receipt" });
    }
  }

  async payOnline(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || 'tenant_primary_001';
      const { planId, billingCycle, paymentMethod } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "يجب اختيار الباقة" });
      }

      const result = await tenantService.payOnline(tenantId, {
        planId,
        billingCycle: billingCycle || 'MONTHLY',
        paymentMethod
      });
      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error processing online payment:", error);
      return res.status(500).json({ error: error.message || "Failed to process payment" });
    }
  }

  async getTenantInvoices(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId || 'tenant_primary_001';
      const invoices = await tenantService.getTenantInvoices(tenantId);
      return res.json({ success: true, data: invoices });
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch invoices" });
    }
  }
}

