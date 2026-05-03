import prisma from '../common/db/prisma';
import { CreateInvoiceInput } from '../validation/invoice.validation';
import { Decimal } from '@prisma/client/runtime/library';

class InvoiceService {
    /**
     * Get all invoices
     */
    async getAllInvoices() {
        return prisma.invoice.findMany({
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameAr: true,
                        lastNameAr: true,
                        firstNameEn: true,
                        lastNameEn: true,
                    },
                },
                items: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get invoice by ID
     */
    async getInvoiceById(id: string) {
        return prisma.invoice.findUnique({
            where: { id },
            include: {
                student: true,
                items: true,
            },
        });
    }

    /**
     * Create a new invoice
     */
    async createInvoice(data: CreateInvoiceInput) {
        // 1. Get Financial Settings for VAT and TRN snapshot
        const settings = await prisma.financialSettings.findFirst();
        if (!settings) {
            throw new Error('Financial settings not found. Please configure settings first.');
        }

        const vatRate = settings.vatRate ? Number(settings.vatRate) : 5;

        // 2. Calculate Totals
        let subtotal = 0;
        let totalVat = 0;

        const itemsToCreate = data.items.map(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemVat = (itemSubtotal * vatRate) / 100;
            const itemTotal = itemSubtotal + itemVat;

            subtotal += itemSubtotal;
            totalVat += itemVat;

            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxableAmount: itemSubtotal,
                vatAmount: itemVat,
                totalAmount: itemTotal,
            };
        });

        const totalAmount = subtotal + totalVat;

        // 3. Generate Invoice Number
        const invoiceNumber = await this.generateInvoiceNumber();

        // 4. Create Invoice
        return prisma.invoice.create({
            data: {
                invoiceNumber,
                studentId: data.studentId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                subtotal,
                vatAmount: totalVat,
                totalAmount,
                trnSnapshot: settings.trn,
                vatRateSnapshot: vatRate,
                status: 'ISSUED',
                items: {
                    create: itemsToCreate,
                },
            },
            include: {
                items: true,
            },
        });
    }

    /**
     * Private helper to generate sequential invoice numbers
     */
    private async generateInvoiceNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;

        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                invoiceNumber: 'desc',
            },
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    }

    /**
     * Update invoice status
     */
    async updateStatus(id: string, status: any) {
        return prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }
}

export default new InvoiceService();
