import prisma from '../common/db/prisma';
import { CreateFinancialYearInput, UpdateFinancialYearInput } from '../validation/financial-year.validation';

class FinancialYearService {
    /**
     * Get all financial years
     */
    async getAllYears() {
        return prisma.financialYear.findMany({
            orderBy: { startDate: 'desc' }
        });
    }

    /**
     * Get current active financial year
     */
    async getCurrentYear() {
        return prisma.financialYear.findFirst({
            where: { isCurrent: true }
        });
    }

    /**
     * Create a new financial year
     */
    async createFinancialYear(data: CreateFinancialYearInput) {
        // If this new year is set to current, unset others
        if (data.isCurrent) {
            await prisma.financialYear.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false }
            });
        }

        return prisma.financialYear.create({
            data: {
                yearName: data.yearName,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isCurrent: data.isCurrent
            }
        });
    }

    /**
     * Update financial year
     */
    async updateFinancialYear(id: string, data: UpdateFinancialYearInput) {
        // If setting to current, unset others first
        if (data.isCurrent === true) {
            await prisma.financialYear.updateMany({
                where: {
                    isCurrent: true,
                    id: { not: id }
                },
                data: { isCurrent: false }
            });
        }

        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        return prisma.financialYear.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Close a financial year (Lock period)
     */
    async closeFinancialYear(id: string) {
        return prisma.financialYear.update({
            where: { id },
            data: { isClosed: true }
        });
    }

    async deleteFinancialYear(id: string) {
        // Prevent deletion if it has linked transactions (check logically before delete)
        // For now, let's assume we can delete if no restrictive FKs exist or rely on DB constraints
        return prisma.financialYear.delete({
            where: { id }
        });
    }
}

export default new FinancialYearService();
