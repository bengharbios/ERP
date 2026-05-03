import { Router } from 'express';
import * as databaseController from './database.controller';
import { authenticateToken as authenticate } from '../../common/utils/jwt';
import { authorize } from '../../common/middleware/rbac';

const router = Router();

// Only Admins should access these
router.get('/export', authenticate, authorize('database', 'export'), databaseController.exportDatabase);
router.post('/import', authenticate, authorize('database', 'import'), databaseController.importDatabase);
router.post('/seed', authenticate, authorize('database', 'seed'), databaseController.seedDemoData);

export default router;
