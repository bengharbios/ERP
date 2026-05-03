import React from 'react';
import {
    Book,
    Settings,
    FileText,
    CreditCard,
    TrendingDown,
    Users,
    PieChart,
    ArrowRightLeft,
    CheckCircle2,
    Info
} from 'lucide-react';
import './AccountingGuide.css';

/**
 * FINANCIAL SYSTEM GUIDE (الدليل المحاسبي والربط النظامي)
 * This page serves as a manual for the institute's financial workflows.
 */

const AccountingGuide: React.FC = () => {
    const modules = [
        {
            id: 'settings',
            title: 'الإعدادات المالية (Financial Settings)',
            icon: <Settings className="icon-orange" />,
            function: 'مصدر البيانات الثابتة للنظام المالي.',
            details: [
                'تحديد الرقم الضريبي للمعهد (TRN) المكون من 15 رقماً.',
                'ضبط نسبة ضريبة القيمة المضافة (5%) حسب قوانين الإمارات.',
                'تعريف الحسابات البنكية والخزينة (Bank & Treasury) برقم الآيبان (IBAN).',
                'هذه البيانات تظهر تلقائياً في جميع الفواتير والتقارير المالية.'
            ]
        },
        {
            id: 'invoicing',
            title: 'الفواتير والإيرادات (Invoicing & Revenue)',
            icon: <FileText className="icon-blue" />,
            function: 'تحويل بيانات التسجيل إلى استحقاقات مالية.',
            details: [
                'ربط الطالب بالبرنامج الدراسي وحساب الرسوم تلقائياً.',
                'حساب ضريبة القيمة المضافة (VAT) على الرسوم المستحقة.',
                'توليد فاتورة ضريبية رسمية (Tax Invoice) تحتوي على TRN.',
                'توزيع المبلغ على أقساط (Installment Schedule) حسب الخطة المختارة.'
            ]
        },
        {
            id: 'receipts',
            title: 'سندات القبض (Receipt Vouchers)',
            icon: <CreditCard className="icon-green" />,
            function: 'إثبات تحصيل المبالغ النقدية والبنكية.',
            details: [
                'عرض الأقساط المستحقة للطالب المختار.',
                'إصدار سند قبض آلي عند السداد برقم تسلسلي فريد.',
                'تحديث حالة القسط من "معلق" إلى "مدفوع" فوراً.',
                'تأثير مباشر على رصيد البنك أو الخزينة المختار.'
            ]
        },
        {
            id: 'expenses',
            title: 'المصاريف والموردين (Expenses & Suppliers)',
            icon: <TrendingDown className="icon-red" />,
            function: 'تتبع التدفقات الخارجة وضريبة المدخلات.',
            details: [
                'تسجيل كافة مصاريف المعهد (إيجار، كهرباء، أدوات مكتبية).',
                'تصنيف المصاريف حسب الفئات (Expense Categories).',
                'حساب ضريبة المدخلات تلقائياً لخصمها من ضريبة المخرجات.',
                'أرشفة صور الفواتير الورقية لكل مصروف للتدقيق.'
            ]
        },
        {
            id: 'payroll',
            title: 'الرواتب و WPS (Payroll & WPS)',
            icon: <Users className="icon-purple" />,
            function: 'إدارة شؤون الموظفين مالياً حسب قانون العمل الإماراتي.',
            details: [
                'ربط الموظف بالراتب الأساسي والبدلات (سكن، مواصلات).',
                'احتساب الاستقطاعات والإضافات شهرياً.',
                'توليد ملف الـ SIF الخاص بنظام حماية الأجور (WPS).',
                'تحويل الرواتب لإصدار قيود محاسبية تلقائية في المصاريف.'
            ]
        },
        {
            id: 'reports',
            title: 'التقارير المالية (Financial Reports)',
            icon: <PieChart className="icon-gold" />,
            function: 'تلخيص الأداء المالي واستخراج بيانات الإقرارات.',
            details: [
                'ميزان المراجعة (Trial Balance): يعرض أرصدة كافة الحسابات.',
                'قائمة الدخل (P&L): (إجمالي الإيرادات - المصاريف والرواتب).',
                'تقرير القيمة المضافة (VAT Report): المخرجات vs المدخلات لغرض الإقرار الضريبي.',
                'كشف حساب طالب/مورد تفصيلي.'
            ]
        }
    ];

    return (
        <div className="guide-page animate-fade-in">
            <header className="guide-header">
                <div className="header-info">
                    <Book className="header-icon" />
                    <div>
                        <h1>الدليل المالي للنيام</h1>
                        <p>دليل الربط المحاسبي والدورة المستندية للنظام المالي المتكامل (UAE Edition)</p>
                    </div>
                </div>
                <div className="header-badge">
                    <CheckCircle2 size={16} />
                    <span>متوافق مع معايير IFRS</span>
                </div>
            </header>

            <main className="guide-grid">
                {modules.map((module) => (
                    <section key={module.id} className="guide-card">
                        <div className="card-head">
                            <div className="icon-box">{module.icon}</div>
                            <h3>{module.title}</h3>
                        </div>
                        <div className="card-body">
                            <div className="function-badge">
                                <Info size={14} />
                                <span>الوظيفة: {module.function}</span>
                            </div>
                            <ul className="details-list">
                                {module.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ))}
            </main>

            <section className="workflow-section">
                <div className="section-title">
                    <ArrowRightLeft size={24} />
                    <h2>خارطة الارتباطات (System Flow)</h2>
                </div>
                <div className="flow-container">
                    <div className="flow-step">
                        <span className="step-num">1</span>
                        <div className="step-box">الإعدادات (Settings)</div>
                        <div className="step-arrow">←</div>
                        <div className="step-desc">توفر TRN والاسم القانوني</div>
                    </div>
                    <div className="flow-step">
                        <span className="step-num">2</span>
                        <div className="step-box">الفواتير (Invoices)</div>
                        <div className="step-arrow">←</div>
                        <div className="step-desc">تنشئ استحقاق مالي (Accrual)</div>
                    </div>
                    <div className="flow-step">
                        <span className="step-num">3</span>
                        <div className="step-box">السندات (Receipts)</div>
                        <div className="step-arrow">←</div>
                        <div className="step-desc">تحول الاستحقاق إلى نقد (Cash)</div>
                    </div>
                    <div className="flow-step">
                        <span className="step-num">4</span>
                        <div className="step-box">التقارير (Reports)</div>
                        <div className="step-arrow">←</div>
                        <div className="step-desc">تلخص كافة العمليات للميزانية</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AccountingGuide;
