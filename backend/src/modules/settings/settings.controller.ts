import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import os from 'os';

// ============================================
// SYSTEM SETTINGS
// ============================================

/**
 * Get system settings (singleton)
 */
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
        let settings = await prisma.settings.findFirst({
            where: { id: 'singleton' }
        });

        // If settings don't exist, return empty or default
        if (!settings) {
            res.json({
                success: true,
                data: { settings: null }
            });
            return;
        }

        res.json({
            success: true,
            data: { settings }
        });
    } catch (error) {
        console.error('Get settings error details:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching system settings'
            }
        });
    }
};

/**
 * Update system settings
 */
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        // White-list fields to prevent Prisma errors from extra/wrong fields
        const allowedFields = [
            'instituteName', 'instituteNameAr', 'instituteNameEn', 'instituteLogo',
            'instituteEmail', 'institutePhone', 'instituteAddress', 'instituteWebsite',
            'awardingBodies', 'defaultAcademicYear', 'gradePassingPercentage', 'attendanceThreshold',
            'defaultLanguage', 'timezone', 'country', 'dateFormat', 'currency',
            'lateFeeAmount', 'lateFeeGraceDays', 'fullPaymentDiscountPercentage', 'fullPaymentDiscountAmount',
            'taxEnabled', 'taxRate',
            'studentNumberPrefix', 'studentNumberLength', 'autoGenerateStudentNumber',
            'emailEnabled', 'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword',
            'smsEnabled', 'smsProvider', 'smsApiKey',
            'externalAiEnabled', 'externalAiProvider', 'externalAiApiKey',
            'hrWorkingDays', 'hrWorkStartTime', 'hrWorkEndTime', 'hrLateGracePeriod',
            'hrAbsenceThreshold', 'hrLateHourDeduction', 'hrShiftEnabled', 'activeTemplate',
            'announcementTicker',
            'reportInstitutionNameAr', 'reportInstitutionNameEn', 'reportLogo',
            'reportWatermarkType', 'reportWatermarkText', 'reportWatermarkImage', 'reportFont'
        ];

        const filteredData: any = {};
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
            }
        });

        console.log('[SettingsController] Updating settings with data:', JSON.stringify(filteredData, null, 2));

        // Convert strings to appropriate types if necessary
        if (filteredData.gradePassingPercentage !== undefined) filteredData.gradePassingPercentage = parseInt(filteredData.gradePassingPercentage);
        if (filteredData.attendanceThreshold !== undefined) filteredData.attendanceThreshold = parseInt(filteredData.attendanceThreshold);
        if (filteredData.lateFeeGraceDays !== undefined) filteredData.lateFeeGraceDays = parseInt(filteredData.lateFeeGraceDays);
        if (filteredData.studentNumberLength !== undefined) filteredData.studentNumberLength = parseInt(filteredData.studentNumberLength);

        // Stringify JSON fields if they are arrays
        if (filteredData.awardingBodies && Array.isArray(filteredData.awardingBodies)) {
            filteredData.awardingBodies = JSON.stringify(filteredData.awardingBodies);
        }
        if (filteredData.hrWorkingDays && Array.isArray(filteredData.hrWorkingDays)) {
            filteredData.hrWorkingDays = JSON.stringify(filteredData.hrWorkingDays);
        }

        console.log('[SettingsController] Filtered & Parsed data:', JSON.stringify(filteredData, null, 2));

        const settings = await prisma.settings.upsert({
            where: { id: 'singleton' },
            update: filteredData,
            create: {
                id: 'singleton',
                instituteName: filteredData.instituteName || 'معهد الإبداع',
                instituteNameAr: filteredData.instituteNameAr || 'معهد الإبداع',
                instituteNameEn: filteredData.instituteNameEn || 'Creativity Institute',
                ...filteredData
            }
        });

        console.log('[SettingsController] Successfully upserted settings:', settings.id);

        res.json({
            success: true,
            data: { settings }
        });
    } catch (error: any) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'An error occurred while updating system settings'
            }
        });
    }
};

// ============================================
// STUDENT REGISTRATIONS
// ============================================

/**
 * Get student registrations
 */
export const getStudentRegistrations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;

        const registrations = await prisma.studentRegistration.findMany({
            where: { studentId }
        });

        res.json({
            success: true,
            data: { registrations }
        });
    } catch (error) {
        console.error('Get student registrations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching student registrations'
            }
        });
    }
};

/**
 * Create or update student registration
 */
export const upsertStudentRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { awardingBodyId, registrationNumber, registrationDate } = req.body;

        const registration = await prisma.studentRegistration.upsert({
            where: {
                studentId_awardingBodyId: {
                    studentId,
                    awardingBodyId
                }
            },
            update: {
                registrationNumber,
                registrationDate: registrationDate ? new Date(registrationDate) : null
            },
            create: {
                studentId,
                awardingBodyId,
                registrationNumber,
                registrationDate: registrationDate ? new Date(registrationDate) : null
            }
        });

        res.json({
            success: true,
            data: { registration }
        });
    } catch (error: any) {
        console.error('Upsert student registration error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while saving student registration'
            }
        });
    }
};

/**
 * Get network information for multi-device access
 */
export const getNetworkInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
        const networkInterfaces = os.networkInterfaces();
        const results: string[] = [];

        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]!) {
                // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
                if (net.family === 'IPv4' && !net.internal) {
                    results.push(net.address);
                }
            }
        }

        res.json({
            success: true,
            data: {
                ips: results,
                port: process.env.PORT || 3000
            }
        });
    } catch (error: any) {
        console.error('Get network info error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Could not retrieve network information'
            }
        });
    }
};
