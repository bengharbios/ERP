import { Request, Response } from 'express';
import { superAdminService } from './superadmin.service';

export class SuperAdminController {
  async getOverview(_req: Request, res: Response) {
    try {
      const data = await superAdminService.getOverview();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTenants(_req: Request, res: Response) {
    try {
      const tenants = await superAdminService.getTenants();
      return res.json({ success: true, data: tenants });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getTenantById(req: Request, res: Response) {
    try {
      const tenant = await superAdminService.getTenantById(req.params.id);
      return res.json({ success: true, data: tenant });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }

  async addTenant(req: Request, res: Response) {
    try {
      const tenant = await superAdminService.addTenant(req.body);
      return res.status(201).json({ success: true, data: tenant });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateTenant(req: Request, res: Response) {
    try {
      const tenant = await superAdminService.updateTenant(req.params.id, req.body);
      return res.json({ success: true, data: tenant });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteTenant(req: Request, res: Response) {
    try {
      const result = await superAdminService.deleteTenant(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async impersonateTenant(req: Request, res: Response) {
    try {
      const result = await superAdminService.impersonateTenant(req.params.id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getSubscriptions(_req: Request, res: Response) {
    try {
      const data = await superAdminService.getSubscriptions();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async reviewReceipt(req: Request, res: Response) {
    try {
      const { status, note } = req.body;
      const receipt = await superAdminService.reviewReceipt(req.params.id, status, note);
      return res.json({ success: true, data: receipt });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getPlans(_req: Request, res: Response) {
    try {
      const plans = await superAdminService.getPlans();
      return res.json({ success: true, data: plans });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updatePlans(req: Request, res: Response) {
    try {
      const plans = await superAdminService.updatePlans(req.body.plans);
      return res.json({ success: true, data: plans });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async getSettings(_req: Request, res: Response) {
    try {
      const settings = await superAdminService.getSettings();
      return res.json({ success: true, data: settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const updated = await superAdminService.updateSettings(req.body);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await superAdminService.login(username, password);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(401).json({ success: false, error: err.message });
    }
  }
}

export const superAdminController = new SuperAdminController();
