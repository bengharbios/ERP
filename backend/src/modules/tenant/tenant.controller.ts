import { Request, Response } from "express";
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

  async getAllTenants(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getAllTenants();
      return res.status(200).json({ success: true, data: tenants });
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      return res.status(500).json({ error: "Failed to fetch tenants" });
    }
  }
}
