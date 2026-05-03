const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * دليل الحسابات الموحد للمعاهد التعليمية في الإمارات
 * مطابق للمعايير المحاسبية الدولية (IFRS) ومتوافق مع قانون ضريبة القيمة المضافة
 */

const defaultChartOfAccounts = [
    // ============================================
    // 1000 - الأصول (ASSETS)
    // ============================================
    {
        code: '1000',
        name: 'Assets',
        nameAr: 'الأصول',
        type: 'ASSET',
        parentId: null,
        balance: 0,
        isActive: true,
        description: 'All assets owned by the institute'
    },

    // 1100 - الأصول المتداولة (Current Assets)
    {
        code: '1100',
        name: 'Current Assets',
        nameAr: 'الأصول المتداولة',
        type: 'ASSET',
        parentCode: '1000',
        balance: 0,
        isActive: true,
        description: 'Assets expected to be converted to cash within one year'
    },
    {
        code: '1110',
        name: 'Bank - Current Account',
        nameAr: 'البنك - حساب جاري',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Main bank account for daily transactions'
    },
    {
        code: '1120',
        name: 'Cash on Hand',
        nameAr: 'الخزينة النقدية',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Physical cash in the safe'
    },
    {
        code: '1130',
        name: 'Accounts Receivable - Students',
        nameAr: 'الطلاب المدينون',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Outstanding tuition fees from students'
    },
    {
        code: '1140',
        name: 'VAT Receivable',
        nameAr: 'ضريبة القيمة المضافة المستردة',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Input VAT to be reclaimed from FTA'
    },
    {
        code: '1150',
        name: 'Prepaid Expenses',
        nameAr: 'مصروفات مدفوعة مقدماً',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Expenses paid in advance (e.g., rent, insurance)'
    },
    {
        code: '1160',
        name: 'Bank Suspense Account',
        nameAr: 'حساب وسيط - عهدة بنكية',
        type: 'ASSET',
        parentCode: '1100',
        balance: 0,
        isActive: true,
        description: 'Temporary account for pending bank transfers/POS'
    },

    // 1200 - الأصول الثابتة (Fixed Assets)
    {
        code: '1200',
        name: 'Fixed Assets',
        nameAr: 'الأصول الثابتة',
        type: 'ASSET',
        parentCode: '1000',
        balance: 0,
        isActive: true,
        description: 'Long-term assets'
    },
    {
        code: '1210',
        name: 'Furniture and Fixtures',
        nameAr: 'الأثاث والمعدات',
        type: 'ASSET',
        parentCode: '1200',
        balance: 0,
        isActive: true,
        description: 'Office furniture and classroom equipment'
    },
    {
        code: '1220',
        name: 'Computer Equipment',
        nameAr: 'أجهزة الكمبيوتر',
        type: 'ASSET',
        parentCode: '1200',
        balance: 0,
        isActive: true,
        description: 'Computers, laptops, and IT equipment'
    },
    {
        code: '1230',
        name: 'Vehicles',
        nameAr: 'المركبات',
        type: 'ASSET',
        parentCode: '1200',
        balance: 0,
        isActive: true,
        description: 'Institute vehicles'
    },

    // ============================================
    // 2000 - الخصوم (LIABILITIES)
    // ============================================
    {
        code: '2000',
        name: 'Liabilities',
        nameAr: 'الخصوم',
        type: 'LIABILITY',
        parentId: null,
        balance: 0,
        isActive: true,
        description: 'All liabilities and obligations'
    },

    // 2100 - الخصوم المتداولة (Current Liabilities)
    {
        code: '2100',
        name: 'Current Liabilities',
        nameAr: 'الخصوم المتداولة',
        type: 'LIABILITY',
        parentCode: '2000',
        balance: 0,
        isActive: true,
        description: 'Liabilities due within one year'
    },
    {
        code: '2110',
        name: 'Accounts Payable',
        nameAr: 'الموردين الدائنين',
        type: 'LIABILITY',
        parentCode: '2100',
        balance: 0,
        isActive: true,
        description: 'Outstanding payments to suppliers'
    },
    {
        code: '2120',
        name: 'VAT Payable',
        nameAr: 'ضريبة القيمة المضافة المستحقة',
        type: 'LIABILITY',
        parentCode: '2100',
        balance: 0,
        isActive: true,
        description: 'Output VAT to be paid to FTA'
    },
    {
        code: '2130',
        name: 'Salaries Payable',
        nameAr: 'رواتب مستحقة الدفع',
        type: 'LIABILITY',
        parentCode: '2100',
        balance: 0,
        isActive: true,
        description: 'Accrued salaries not yet paid'
    },
    {
        code: '2140',
        name: 'Deferred Revenue',
        nameAr: 'إيرادات مؤجلة',
        type: 'LIABILITY',
        parentCode: '2100',
        balance: 0,
        isActive: true,
        description: 'Tuition fees received in advance (IFRS 15)'
    },

    // 2200 - القروض طويلة الأجل (Long-term Liabilities)
    {
        code: '2200',
        name: 'Long-term Liabilities',
        nameAr: 'الخصوم طويلة الأجل',
        type: 'LIABILITY',
        parentCode: '2000',
        balance: 0,
        isActive: true,
        description: 'Long-term debts and loans'
    },
    {
        code: '2210',
        name: 'Bank Loans',
        nameAr: 'القروض البنكية',
        type: 'LIABILITY',
        parentCode: '2200',
        balance: 0,
        isActive: true,
        description: 'Long-term bank loans'
    },

    // ============================================
    // 3000 - حقوق الملكية (EQUITY)
    // ============================================
    {
        code: '3000',
        name: 'Equity',
        nameAr: 'حقوق الملكية',
        type: 'EQUITY',
        parentId: null,
        balance: 0,
        isActive: true,
        description: 'Owner equity and retained earnings'
    },
    {
        code: '3100',
        name: 'Capital',
        nameAr: 'رأس المال',
        type: 'EQUITY',
        parentCode: '3000',
        balance: 0,
        isActive: true,
        description: 'Initial investment capital'
    },
    {
        code: '3200',
        name: 'Retained Earnings',
        nameAr: 'الأرباح المحتجزة',
        type: 'EQUITY',
        parentCode: '3000',
        balance: 0,
        isActive: true,
        description: 'Accumulated profits from previous years'
    },
    {
        code: '3300',
        name: 'Current Year Profit/Loss',
        nameAr: 'ربح أو خسارة العام الحالي',
        type: 'EQUITY',
        parentCode: '3000',
        balance: 0,
        isActive: true,
        description: 'Net profit or loss for current year'
    },

    // ============================================
    // 4000 - الإيرادات (REVENUE)
    // ============================================
    {
        code: '4000',
        name: 'Revenue',
        nameAr: 'الإيرادات',
        type: 'REVENUE',
        parentId: null,
        balance: 0,
        isActive: true,
        description: 'All income and revenue'
    },
    {
        code: '4100',
        name: 'Tuition Fee Revenue',
        nameAr: 'إيرادات الرسوم الدراسية',
        type: 'REVENUE',
        parentCode: '4000',
        balance: 0,
        isActive: true,
        description: 'Main tuition fees from students'
    },
    {
        code: '4200',
        name: 'Registration Fee Revenue',
        nameAr: 'إيرادات رسوم التسجيل',
        type: 'REVENUE',
        parentCode: '4000',
        balance: 0,
        isActive: true,
        description: 'One-time registration fees'
    },
    {
        code: '4300',
        name: 'Certificate Fee Revenue',
        nameAr: 'إيرادات رسوم الشهادات',
        type: 'REVENUE',
        parentCode: '4000',
        balance: 0,
        isActive: true,
        description: 'Certificate issuance fees'
    },
    {
        code: '4400',
        name: 'Other Revenue',
        nameAr: 'إيرادات أخرى',
        type: 'REVENUE',
        parentCode: '4000',
        balance: 0,
        isActive: true,
        description: 'Miscellaneous income'
    },

    // ============================================
    // 5000 - المصروفات (EXPENSES)
    // ============================================
    {
        code: '5000',
        name: 'Expenses',
        nameAr: 'المصروفات',
        type: 'EXPENSE',
        parentId: null,
        balance: 0,
        isActive: true,
        description: 'All expenses and costs'
    },

    // 5100 - مصروفات الموظفين (Staff Expenses)
    {
        code: '5100',
        name: 'Staff Expenses',
        nameAr: 'مصروفات الموظفين',
        type: 'EXPENSE',
        parentCode: '5000',
        balance: 0,
        isActive: true,
        description: 'All staff-related costs'
    },
    {
        code: '5110',
        name: 'Salaries and Wages',
        nameAr: 'الرواتب والأجور',
        type: 'EXPENSE',
        parentCode: '5100',
        balance: 0,
        isActive: true,
        description: 'Employee salaries and wages'
    },
    {
        code: '5120',
        name: 'Employee Benefits',
        nameAr: 'مزايا الموظفين',
        type: 'EXPENSE',
        parentCode: '5100',
        balance: 0,
        isActive: true,
        description: 'Health insurance, training, etc.'
    },

    // 5200 - مصروفات التشغيل (Operating Expenses)
    {
        code: '5200',
        name: 'Operating Expenses',
        nameAr: 'مصروفات التشغيل',
        type: 'EXPENSE',
        parentCode: '5000',
        balance: 0,
        isActive: true,
        description: 'Day-to-day operating costs'
    },
    {
        code: '5210',
        name: 'Rent Expense',
        nameAr: 'مصروف الإيجار',
        type: 'EXPENSE',
        parentCode: '5200',
        balance: 0,
        isActive: true,
        description: 'Building and office rent'
    },
    {
        code: '5220',
        name: 'Utilities',
        nameAr: 'المرافق (كهرباء، ماء)',
        type: 'EXPENSE',
        parentCode: '5200',
        balance: 0,
        isActive: true,
        description: 'Electricity, water, internet, etc.'
    },
    {
        code: '5230',
        name: 'Stationery and Supplies',
        nameAr: 'القرطاسية والمستلزمات',
        type: 'EXPENSE',
        parentCode: '5200',
        balance: 0,
        isActive: true,
        description: 'Office supplies and materials'
    },
    {
        code: '5240',
        name: 'Maintenance and Repairs',
        nameAr: 'الصيانة والإصلاحات',
        type: 'EXPENSE',
        parentCode: '5200',
        balance: 0,
        isActive: true,
        description: 'Maintenance costs'
    },
    {
        code: '5250',
        name: 'Cleaning Services',
        nameAr: 'خدمات النظافة',
        type: 'EXPENSE',
        parentCode: '5200',
        balance: 0,
        isActive: true,
        description: 'Cleaning and janitorial services'
    },

    // 5300 - مصروفات إدارية (Administrative Expenses)
    {
        code: '5300',
        name: 'Administrative Expenses',
        nameAr: 'مصروفات إدارية',
        type: 'EXPENSE',
        parentCode: '5000',
        balance: 0,
        isActive: true,
        description: 'Admin and overhead costs'
    },
    {
        code: '5310',
        name: 'Marketing and Advertising',
        nameAr: 'التسويق والإعلان',
        type: 'EXPENSE',
        parentCode: '5300',
        balance: 0,
        isActive: true,
        description: 'Marketing campaigns and ads'
    },
    {
        code: '5320',
        name: 'Professional Fees',
        nameAr: 'أتعاب مهنية',
        type: 'EXPENSE',
        parentCode: '5300',
        balance: 0,
        isActive: true,
        description: 'Legal, accounting, consulting fees'
    },
    {
        code: '5330',
        name: 'Bank Charges',
        nameAr: 'رسوم بنكية',
        type: 'EXPENSE',
        parentCode: '5300',
        balance: 0,
        isActive: true,
        description: 'Bank fees and charges'
    },
    {
        code: '5340',
        name: 'Software and Subscriptions',
        nameAr: 'البرمجيات والاشتراكات',
        type: 'EXPENSE',
        parentCode: '5300',
        balance: 0,
        isActive: true,
        description: 'Software licenses and subscriptions'
    },
    {
        code: '5350',
        name: 'Travel and Transportation',
        nameAr: 'السفر والمواصلات',
        type: 'EXPENSE',
        parentCode: '5300',
        balance: 0,
        isActive: true,
        description: 'Business travel expenses'
    },

    // 5400 - مصروفات أخرى (Other Expenses)
    {
        code: '5400',
        name: 'Other Expenses',
        nameAr: 'مصروفات أخرى',
        type: 'EXPENSE',
        parentCode: '5000',
        balance: 0,
        isActive: true,
        description: 'Miscellaneous expenses'
    },
    {
        code: '5410',
        name: 'Depreciation Expense',
        nameAr: 'مصروف الاستهلاك',
        type: 'EXPENSE',
        parentCode: '5400',
        balance: 0,
        isActive: true,
        description: 'Depreciation of fixed assets'
    },
    {
        code: '5420',
        name: 'Miscellaneous Expense',
        nameAr: 'مصروفات متنوعة',
        type: 'EXPENSE',
        parentCode: '5400',
        balance: 0,
        isActive: true,
        description: 'Other miscellaneous costs'
    }
];

async function seedChartOfAccounts() {
    console.log('🌱 Seeding Chart of Accounts...\n');

    try {
        // First, create a map of code to ID for parent relationships
        const accountMap = new Map();

        // Create accounts in order (parents first)
        for (const account of defaultChartOfAccounts) {
            const { parentCode, ...accountData } = account;

            // If has parentCode, find the parent ID
            if (parentCode) {
                const parentId = accountMap.get(parentCode);
                if (!parentId) {
                    console.error(`❌ Parent account ${parentCode} not found for ${account.code}`);
                    continue;
                }
                accountData.parentId = parentId;
            }

            // Create the account
            const createdAccount = await prisma.account.upsert({
                where: { code: account.code },
                update: accountData,
                create: accountData
            });

            accountMap.set(account.code, createdAccount.id);
            console.log(`✅ ${account.code} - ${account.nameAr}`);
        }

        console.log(`\n🎉 Successfully seeded ${accountMap.size} accounts!`);

        // Print summary by type
        const summary = await prisma.account.groupBy({
            by: ['type'],
            _count: true
        });

        console.log('\n📊 Summary:');
        summary.forEach(item => {
            console.log(`   ${item.type}: ${item._count} accounts`);
        });

    } catch (error) {
        console.error('❌ Error seeding accounts:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedChartOfAccounts()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
