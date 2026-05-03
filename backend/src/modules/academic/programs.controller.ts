import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createProgramSchema,
    updateProgramSchema,
    addUnitsToProgram as addUnitsToProgramSchema,
} from './academic.validation';

// Create Program
export const createProgram = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createProgramSchema.parse(req.body);
        const { unitIds, ...programData } = validatedData;

        // Check if code already exists
        const existing = await prisma.program.findUnique({
            where: { code: programData.code },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'PROGRAM_EXISTS',
                    message: 'Program with this code already exists',
                },
            });
            return;
        }

        // Create program
        const program = await prisma.program.create({
            data: {
                ...programData,
                totalUnits: unitIds?.length || programData.totalUnits,
            },
        });

        // Add units if provided
        if (unitIds && unitIds.length > 0) {
            await Promise.all(
                unitIds.map((unitId, index) =>
                    prisma.programUnit.create({
                        data: {
                            programId: program.id,
                            unitId,
                            sequenceOrder: index + 1,
                            isMandatory: true,
                        },
                    })
                )
            );
        }

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PROGRAM_CREATED',
                    resourceType: 'Program',
                    resourceId: program.id,
                    afterData: { code: program.code, name: program.nameEn },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        // Fetch complete program with units
        const completeProgram = await prisma.program.findUnique({
            where: { id: program.id },
            include: {
                programLevel: true,
                awardingBody: true,
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: { program: completeProgram },
        });
    } catch (error: any) {
        console.error('Create program error:', error.message || error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating the program',
            },
        });
    }
};

// Get All Programs
export const getPrograms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;

        const programs = await prisma.program.findMany({
            where: isActive !== undefined ? { isActive: isActive === 'true' } : undefined,
            include: {
                programLevel: true,
                awardingBody: true,
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
                _count: {
                    select: {
                        classes: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                programs,
                total: programs.length,
            },
        });
    } catch (error: any) {
        console.error('Get programs error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching programs',
            },
        });
    }
};

// Get Program by ID
export const getProgramById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const program = await prisma.program.findUnique({
            where: { id },
            include: {
                programLevel: true,
                awardingBody: true,
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
                classes: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        startDate: true,
                        status: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!program) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PROGRAM_NOT_FOUND',
                    message: 'Program not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { program },
        });
    } catch (error: any) {
        console.error('Get program error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the program',
            },
        });
    }
};

// Update Program
export const updateProgram = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateProgramSchema.parse(req.body);

        const existing = await prisma.program.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PROGRAM_NOT_FOUND',
                    message: 'Program not found',
                },
            });
            return;
        }

        // Check if code is being changed and already exists
        if (validatedData.code && validatedData.code !== existing.code) {
            const codeExists = await prisma.program.findUnique({
                where: { code: validatedData.code },
            });

            if (codeExists) {
                res.status(409).json({
                    success: false,
                    error: {
                        code: 'CODE_EXISTS',
                        message: 'Program code already exists',
                    },
                });
                return;
            }
        }

        const { unitIds, ...updateData } = validatedData;

        // If unitIds are provided, recalculate totalUnits and sync relations
        if (unitIds !== undefined) {
            updateData.totalUnits = unitIds.length;

            // Delete existing units
            await prisma.programUnit.deleteMany({
                where: { programId: id },
            });

            // Add new units
            if (unitIds.length > 0) {
                await Promise.all(
                    unitIds.map((unitId, index) =>
                        prisma.programUnit.create({
                            data: {
                                programId: id,
                                unitId,
                                sequenceOrder: index + 1,
                                isMandatory: true,
                            },
                        })
                    )
                );
            }
        }

        const program = await prisma.program.update({
            where: { id },
            data: updateData,
            include: {
                programLevel: true,
                awardingBody: true,
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PROGRAM_UPDATED',
                    resourceType: 'Program',
                    resourceId: program.id,
                    beforeData: existing,
                    afterData: program,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { program },
        });
    } catch (error: any) {
        console.error('Update program error:', error.message || error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating the program',
            },
        });
    }
};

// Delete Program
export const deleteProgram = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const program = await prisma.program.findUnique({
            where: { id },
            include: {
                classes: true,
            },
        });

        if (!program) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PROGRAM_NOT_FOUND',
                    message: 'Program not found',
                },
            });
            return;
        }

        // Check if program has classes
        if (program.classes.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'PROGRAM_HAS_CLASSES',
                    message: 'Cannot delete program with existing classes',
                },
            });
            return;
        }

        await prisma.program.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PROGRAM_DELETED',
                    resourceType: 'Program',
                    resourceId: id,
                    beforeData: program,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Program deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete program error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the program',
            },
        });
    }
};

// Add Units to Program
export const addUnitsToProgram = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = addUnitsToProgramSchema.parse(req.body);

        const program = await prisma.program.findUnique({
            where: { id },
            include: {
                programUnits: true,
            },
        });

        if (!program) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PROGRAM_NOT_FOUND',
                    message: 'Program not found',
                },
            });
            return;
        }

        // Get current max sequence order
        const maxSequence = program.programUnits.reduce(
            (max, pu) => Math.max(max, pu.sequenceOrder || 0),
            0
        );

        // Add new units
        await Promise.all(
            validatedData.unitIds.map((unitId, index) =>
                prisma.programUnit.create({
                    data: {
                        programId: id,
                        unitId,
                        sequenceOrder: maxSequence + index + 1,
                        isMandatory: true,
                    },
                })
            )
        );

        // Update total units
        await prisma.program.update({
            where: { id },
            data: {
                totalUnits: program.programUnits.length + validatedData.unitIds.length,
            },
        });

        // Fetch updated program
        const updatedProgram = await prisma.program.findUnique({
            where: { id },
            include: {
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UNITS_ADDED_TO_PROGRAM',
                    resourceType: 'Program',
                    resourceId: id,
                    afterData: { unitIds: validatedData.unitIds },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { program: updatedProgram },
        });
    } catch (error: any) {
        console.error('Add units error:', error.message || error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while adding units',
            },
        });
    }
};
