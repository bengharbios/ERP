import express from 'express';
import accountController from '../controllers/account.controller';
import journalController from '../controllers/journal.controller';
import financialYearController from '../controllers/financial-year.controller';
import receiptController from '../controllers/receipt.controller';
import financialSettingsController from '../controllers/financial-settings.controller';
import invoiceController from '../controllers/invoice.controller';
import { authenticateToken } from '../common/utils/jwt';
import { checkPermission } from '../common/middleware/rbac';

const router = express.Router();

// All accounting routes require authentication
router.use(authenticateToken);

// ============================================
// ACCOUNT ROUTES
// ============================================

// GET /api/accounting/accounts - Get all accounts
router.get(
    '/accounts',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccounts.bind(accountController)
);

// GET /api/accounting/accounts/tree - Get account tree
router.get(
    '/accounts/tree',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccountTree.bind(accountController)
);

// GET /api/accounting/accounts/type/:type - Get accounts by type
router.get(
    '/accounts/type/:type',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccountsByType.bind(accountController)
);

// GET /api/accounting/accounts/code/:code - Get account by code
router.get(
    '/accounts/code/:code',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccountByCode.bind(accountController)
);

// GET /api/accounting/accounts/:id - Get account by ID
router.get(
    '/accounts/:id',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccountById.bind(accountController)
);

// GET /api/accounting/accounts/:id/balance - Get account balance
router.get(
    '/accounts/:id/balance',
    checkPermission({ resource: 'accounts', action: 'read' }),
    accountController.getAccountBalance.bind(accountController)
);

// POST /api/accounting/accounts - Create new account
router.post(
    '/accounts',
    checkPermission({ resource: 'accounts', action: 'create' }),
    accountController.createAccount.bind(accountController)
);

// PUT /api/accounting/accounts/:id - Update account
router.put(
    '/accounts/:id',
    checkPermission({ resource: 'accounts', action: 'update' }),
    accountController.updateAccount.bind(accountController)
);

// DELETE /api/accounting/accounts/:id - Delete account
router.delete(
    '/accounts/:id',
    checkPermission({ resource: 'accounts', action: 'delete' }),
    accountController.deleteAccount.bind(accountController)
);

// ============================================
// JOURNAL ENTRY ROUTES
// ============================================

// GET /api/accounting/journal-entries - Get all entries
router.get(
    '/journal-entries',
    checkPermission({ resource: 'journal_entries', action: 'read' }),
    journalController.getJournalEntries.bind(journalController)
);

// GET /api/accounting/journal-entries/:id - Get specific entry
router.get(
    '/journal-entries/:id',
    checkPermission({ resource: 'journal_entries', action: 'read' }),
    journalController.getJournalEntryById.bind(journalController)
);

// POST /api/accounting/journal-entries - Create draft entry
router.post(
    '/journal-entries',
    checkPermission({ resource: 'journal_entries', action: 'create' }),
    journalController.createJournalEntry.bind(journalController)
);

// PUT /api/accounting/journal-entries/:id/post - Post/Finalize entry
router.put(
    '/journal-entries/:id/post',
    checkPermission({ resource: 'journal_entries', action: 'manage' }),
    journalController.postJournalEntry.bind(journalController)
);

// DELETE /api/accounting/journal-entries/:id - Delete draft entry
router.delete(
    '/journal-entries/:id',
    checkPermission({ resource: 'journal_entries', action: 'delete' }),
    journalController.deleteJournalEntry.bind(journalController)
);


// ============================================
// FINANCIAL YEAR ROUTES
// ============================================

// GET /api/accounting/financial-years/current
router.get(
    '/financial-years/current',
    checkPermission({ resource: 'settings', action: 'read' }),
    financialYearController.getCurrentYear.bind(financialYearController)
);

// GET /api/accounting/financial-years
router.get(
    '/financial-years',
    checkPermission({ resource: 'settings', action: 'read' }),
    financialYearController.getAllYears.bind(financialYearController)
);

// POST /api/accounting/financial-years
router.post(
    '/financial-years',
    checkPermission({ resource: 'settings', action: 'manage' }),
    financialYearController.createFinancialYear.bind(financialYearController)
);

// PUT /api/accounting/financial-years/:id
router.put(
    '/financial-years/:id',
    checkPermission({ resource: 'settings', action: 'manage' }),
    financialYearController.updateFinancialYear.bind(financialYearController)
);

// PUT /api/accounting/financial-years/:id/close
router.put(
    '/financial-years/:id/close',
    checkPermission({ resource: 'settings', action: 'manage' }),
    financialYearController.closeFinancialYear.bind(financialYearController)
);

// DELETE /api/accounting/financial-years/:id
router.delete(
    '/financial-years/:id',
    checkPermission({ resource: 'settings', action: 'manage' }),
    financialYearController.deleteFinancialYear.bind(financialYearController)
);

// ============================================
// RECEIPT VOUCHER ROUTES
// ============================================

// GET /api/accounting/receipts
router.get(
    '/receipts',
    checkPermission({ resource: 'receipts', action: 'read' }),
    receiptController.getReceipts.bind(receiptController)
);

// GET /api/accounting/receipts/:id
router.get(
    '/receipts/:id',
    checkPermission({ resource: 'receipts', action: 'read' }),
    receiptController.getReceiptById.bind(receiptController)
);

// POST /api/accounting/receipts
router.post(
    '/receipts',
    checkPermission({ resource: 'receipts', action: 'create' }),
    receiptController.createReceipt.bind(receiptController)
);

// PUT /api/accounting/receipts/:id
router.put(
    '/receipts/:id',
    checkPermission({ resource: 'receipts', action: 'update' }),
    receiptController.updateReceipt.bind(receiptController)
);

// PUT /api/accounting/receipts/:id/post
router.put(
    '/receipts/:id/post',
    checkPermission({ resource: 'receipts', action: 'manage' }),
    receiptController.postReceipt.bind(receiptController)
);

// DELETE /api/accounting/receipts/:id
router.delete(
    '/receipts/:id',
    checkPermission({ resource: 'receipts', action: 'delete' }),
    receiptController.deleteReceipt.bind(receiptController)
);

// ============================================
// FINANCIAL SETTINGS ROUTES
// ============================================

// GET /api/accounting/settings
router.get(
    '/settings',
    checkPermission({ resource: 'settings', action: 'read' }),
    financialSettingsController.getSettings.bind(financialSettingsController)
);

// PUT /api/accounting/settings
router.put(
    '/settings',
    checkPermission({ resource: 'settings', action: 'manage' }),
    financialSettingsController.updateSettings.bind(financialSettingsController)
);

// ============================================
// TAX INVOICE ROUTES
// ============================================

// GET /api/accounting/invoices
router.get(
    '/invoices',
    checkPermission({ resource: 'invoices', action: 'read' }),
    invoiceController.getAllInvoices.bind(invoiceController)
);

// GET /api/accounting/invoices/:id
router.get(
    '/invoices/:id',
    checkPermission({ resource: 'invoices', action: 'read' }),
    invoiceController.getInvoiceById.bind(invoiceController)
);

// POST /api/accounting/invoices
router.post(
    '/invoices',
    checkPermission({ resource: 'invoices', action: 'create' }),
    invoiceController.createInvoice.bind(invoiceController)
);

// PUT /api/accounting/invoices/:id/status
router.put(
    '/invoices/:id/status',
    checkPermission({ resource: 'invoices', action: 'manage' }),
    invoiceController.updateStatus.bind(invoiceController)
);

export default router;
