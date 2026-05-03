import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as financeController from './finance.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// FEE TEMPLATES ROUTES
// ============================================

router.get('/templates', financeController.getFeeTemplates);
router.get('/templates/:id', financeController.getFeeTemplateById);

router.post(
    '/templates',
    checkPermission({ resource: 'fees', action: 'create' }),
    financeController.createFeeTemplate
);

router.put(
    '/templates/:id',
    checkPermission({ resource: 'fees', action: 'update' }),
    financeController.updateFeeTemplate
);

router.delete(
    '/templates/:id',
    checkPermission({ resource: 'fees', action: 'delete' }),
    financeController.deleteFeeTemplate
);

// ============================================
// STUDENT FEE CALCULATIONS ROUTES
// ============================================

router.get('/calculations', financeController.getStudentFeeCalculations);
router.get('/calculations/:id', financeController.getStudentFeeCalculationById);

router.post(
    '/calculations',
    checkPermission({ resource: 'fees', action: 'create' }),
    financeController.createStudentFeeCalculation
);

router.put(
    '/calculations/:id',
    checkPermission({ resource: 'fees', action: 'update' }),
    financeController.updateStudentFeeCalculation
);

router.delete(
    '/calculations/:id',
    checkPermission({ resource: 'fees', action: 'delete' }),
    financeController.deleteStudentFeeCalculation
);

// ============================================
// INSTALLMENT PLANS ROUTES
// ============================================

router.post(
    '/installments',
    checkPermission({ resource: 'fees', action: 'create' }),
    financeController.createInstallmentPlan
);

router.get('/installments/:id', financeController.getInstallmentPlan);
router.get('/calculations/:calculationId/installments', financeController.getInstallmentsByCalculation);

// ============================================
// DISCOUNTS ROUTES
// ============================================

router.get('/discounts', financeController.getDiscounts);

router.post(
    '/discounts',
    checkPermission({ resource: 'fees', action: 'create' }),
    financeController.createDiscount
);

router.put(
    '/discounts/:id',
    checkPermission({ resource: 'fees', action: 'update' }),
    financeController.updateDiscount
);

router.delete(
    '/discounts/:id',
    checkPermission({ resource: 'fees', action: 'delete' }),
    financeController.deleteDiscount
);

// ============================================
// PAYMENTS ROUTES
// ============================================

router.get('/payments', financeController.getPayments);
router.get('/payments/:id', financeController.getPaymentById);

router.post(
    '/payments',
    checkPermission({ resource: 'fees', action: 'create' }),
    financeController.createPayment
);

router.post(
    '/payments/:id/reconcile',
    checkPermission({ resource: 'fees', action: 'update' }),
    financeController.reconcilePayment
);

export default router;
