import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';

// ============================================
// PROGRAM LEVELS
// ============================================

export const getProgramLevels = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const levels = await prisma.programLevel.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { programs: true }
                }
            }
        });

        res.json({
            success: true,
            data: {
                levels,
                total: levels.length
            }
        });
    } catch (error: any) {
        console.error('Get program levels error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching program levels'
            }
        });
    }
};

export const createProgramLevel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nameAr, nameEn, order, isActive } = req.body;

        const level = await prisma.programLevel.create({
            data: {
                nameAr,
                nameEn,
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({
            success: true,
            data: { level }
        });
    } catch (error: any) {
        console.error('Create program level error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating program level'
            }
        });
    }
};

export const updateProgramLevel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, order, isActive } = req.body;

        const level = await prisma.programLevel.update({
            where: { id },
            data: {
                ...(nameAr && { nameAr }),
                ...(nameEn && { nameEn }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json({
            success: true,
            data: { level }
        });
    } catch (error: any) {
        console.error('Update program level error:', error.message || error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Program level not found'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating program level'
            }
        });
    }
};

export const deleteProgramLevel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if level is used by programs
        const programCount = await prisma.program.count({
            where: { levelId: id }
        });

        if (programCount > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'LEVEL_IN_USE',
                    message: `Cannot delete level. It is used by ${programCount} program(s)`,
                    details: { programCount }
                }
            });
            return;
        }

        await prisma.programLevel.delete({
            where: { id }
        });

        res.json({
            success: true,
            data: { message: 'Program level deleted successfully' }
        });
    } catch (error: any) {
        console.error('Delete program level error:', error.message || error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Program level not found'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting program level'
            }
        });
    }
};

// ============================================
// AWARDING BODIES
// ============================================

export const getAwardingBodies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const bodies = await prisma.awardingBody.findMany({
            where,
            orderBy: { nameEn: 'asc' },
            include: {
                _count: {
                    select: { programs: true }
                }
            }
        });

        res.json({
            success: true,
            data: {
                bodies,
                total: bodies.length
            }
        });
    } catch (error: any) {
        console.error('Get awarding bodies error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching awarding bodies'
            }
        });
    }
};

export const createAwardingBody = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, nameAr, nameEn, description, website, isActive } = req.body;

        const body = await prisma.awardingBody.create({
            data: {
                code,
                nameAr,
                nameEn,
                description,
                website,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({
            success: true,
            data: { body }
        });
    } catch (error: any) {
        console.error('Create awarding body error:', error.message || error);

        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'DUPLICATE_CODE',
                    message: 'Awarding body with this code already exists'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating awarding body'
            }
        });
    }
};

export const updateAwardingBody = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { code, nameAr, nameEn, description, website, isActive } = req.body;

        const body = await prisma.awardingBody.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(nameAr && { nameAr }),
                ...(nameEn && { nameEn }),
                ...(description !== undefined && { description }),
                ...(website !== undefined && { website }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json({
            success: true,
            data: { body }
        });
    } catch (error: any) {
        console.error('Update awarding body error:', error.message || error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Awarding body not found'
                }
            });
            return;
        }

        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'DUPLICATE_CODE',
                    message: 'Awarding body with this code already exists'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating awarding body'
            }
        });
    }
};

export const deleteAwardingBody = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if body is used by programs
        const programCount = await prisma.program.count({
            where: { awardingBodyId: id }
        });

        if (programCount > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'BODY_IN_USE',
                    message: `Cannot delete awarding body. It is used by ${programCount} program(s)`,
                    details: { programCount }
                }
            });
            return;
        }

        await prisma.awardingBody.delete({
            where: { id }
        });

        res.json({
            success: true,
            data: { message: 'Awarding body deleted successfully' }
        });
    } catch (error: any) {
        console.error('Delete awarding body error:', error.message || error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Awarding body not found'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting awarding body'
            }
        });
    }
};
