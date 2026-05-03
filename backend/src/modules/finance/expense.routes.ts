import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as expenseController from './expense.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// EXPENSE CATEGORY ROUTES
// ============================================

router.get('/categories', expenseController.getCategories);

router.post(
    '/categories',
    checkPermission({ resource: 'finance', action: 'create' }),
    expenseController.createCategory
);

router.put(
    '/categories/:id',
    checkPermission({ resource: 'finance', action: 'update' }),
    expenseController.updateCategory
);

router.delete(
    '/categories/:id',
    checkPermission({ resource: 'finance', action: 'delete' }),
    expenseController.deleteCategory
);

// ============================================
// EXPENSE ROUTES
// ============================================

router.get('/', expenseController.getExpenses);
router.get('/stats', expenseController.getStats);
router.get('/:id', expenseController.getExpenseDetails);

router.post(
    '/',
    checkPermission({ resource: 'finance', action: 'create' }),
    expenseController.createExpense
);

router.put(
    '/:id',
    checkPermission({ resource: 'finance', action: 'update' }),
    expenseController.updateExpense
);

router.delete(
    '/:id',
    checkPermission({ resource: 'finance', action: 'delete' }),
    expenseController.deleteExpense
);

export default router;
