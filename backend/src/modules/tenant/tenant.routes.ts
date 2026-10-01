import { Router } from "express";
import { TenantController } from "./tenant.controller";

const router = Router();
const tenantController = new TenantController();

// Create a new tenant (Should be protected by SuperAdmin middleware in the future)
router.post("/", tenantController.createTenant);

// Get all tenants
router.get("/", tenantController.getAllTenants);

export default router;
