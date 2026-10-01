import { Router } from "express";
import { TenantController } from "./tenant.controller";
import { authenticateToken } from "../../common/utils/jwt";

const router = Router();
const tenantController = new TenantController();

// Get real-time stats for the authenticated tenant
router.get("/my-stats", authenticateToken, (req, res) => tenantController.getMyStats(req, res));

// Create a new tenant (Should be protected by SuperAdmin middleware in the future)
router.post("/", tenantController.createTenant);

// Get all tenants
router.get("/", tenantController.getAllTenants);

export default router;
