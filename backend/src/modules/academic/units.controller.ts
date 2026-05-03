import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createUnitSchema,
    updateUnitSchema,
} from './academic.validation';

// Create Unit
export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createUnitSchema.parse(req.body);

        // Check if code already exists
        const existing = await prisma.unit.findUnique({
            where: { code: validatedData.code },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'UNIT_EXISTS',
                    message: 'Unit with this code already exists',
                },
            });
            return;
        }

        // Separate programIds from unit data
        const { programIds, ...unitData } = validatedData;

        // Create unit
        const unit = await prisma.unit.create({
            data: {
                ...unitData,
                learningOutcomes: unitData.learningOutcomes || [],
            },
        });

        // Assign unit to programs if programIds provided
        if (programIds && programIds.length > 0) {
            await prisma.programUnit.createMany({
                data: programIds.map((programId, index) => ({
                    unitId: unit.id,
                    programId,
                    sequenceOrder: index + 1,
                    isMandatory: true,
                })),
            });
        }

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UNIT_CREATED',
                    resourceType: 'Unit',
                    resourceId: unit.id,
                    afterData: { code: unit.code, name: unit.nameEn },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { unit },
        });
    } catch (error: any) {
        console.error('Create unit error:', error.message || error);

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
                message: 'An error occurred while creating the unit',
            },
        });
    }
};

// Get All Units
export const getUnits = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;

        const units = await prisma.unit.findMany({
            where: isActive !== undefined ? { isActive: isActive === 'true' } : undefined,
            include: {
                programUnits: {
                    include: {
                        program: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        programUnits: true,
                        lectures: true,
                        assignments: true,
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
                units,
                total: units.length,
            },
        });
    } catch (error: any) {
        console.error('Get units error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching units',
            },
        });
    }
};

// Get Unit by ID
export const getUnitById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                programUnits: {
                    include: {
                        program: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        lectures: true,
                        assignments: true,
                    },
                },
            },
        });

        if (!unit) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'UNIT_NOT_FOUND',
                    message: 'Unit not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { unit },
        });
    } catch (error: any) {
        console.error('Get unit error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the unit',
            },
        });
    }
};

// Update Unit
export const updateUnit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateUnitSchema.parse(req.body);

        const existing = await prisma.unit.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'UNIT_NOT_FOUND',
                    message: 'Unit not found',
                },
            });
            return;
        }

        // Check if code is being changed and already exists
        if (validatedData.code && validatedData.code !== existing.code) {
            const codeExists = await prisma.unit.findUnique({
                where: { code: validatedData.code },
            });

            if (codeExists) {
                res.status(409).json({
                    success: false,
                    error: {
                        code: 'CODE_EXISTS',
                        message: 'Unit code already exists',
                    },
                });
                return;
            }
        }

        // Separate programIds from unit data
        const { programIds, ...unitData } = validatedData;

        const unit = await prisma.unit.update({
            where: { id },
            data: unitData,
        });

        // Update program assignments if programIds provided
        if (programIds !== undefined) {
            // Delete existing associations
            await prisma.programUnit.deleteMany({
                where: { unitId: id },
            });

            // Create new associations
            if (programIds.length > 0) {
                await prisma.programUnit.createMany({
                    data: programIds.map((programId, index) => ({
                        unitId: id,
                        programId,
                        sequenceOrder: index + 1,
                        isMandatory: true,
                    })),
                });
            }
        }

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UNIT_UPDATED',
                    resourceType: 'Unit',
                    resourceId: unit.id,
                    beforeData: existing,
                    afterData: unit,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { unit },
        });
    } catch (error: any) {
        console.error('Update unit error:', error.message || error);

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
                message: 'An error occurred while updating the unit',
            },
        });
    }
};

// Delete Unit
export const deleteUnit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                programUnits: true,
                lectures: true,
            },
        });

        if (!unit) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'UNIT_NOT_FOUND',
                    message: 'Unit not found',
                },
            });
            return;
        }

        // Check if unit is used
        if (unit.programUnits.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'UNIT_IN_USE',
                    message: 'Cannot delete unit that is assigned to programs',
                },
            });
            return;
        }

        if (unit.lectures.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'UNIT_HAS_LECTURES',
                    message: 'Cannot delete unit with existing lectures',
                },
            });
            return;
        }

        await prisma.unit.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UNIT_DELETED',
                    resourceType: 'Unit',
                    resourceId: id,
                    beforeData: unit,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Unit deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete unit error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the unit',
            },
        });
    }
};

// Get Students Enrolled in a Unit
export const getUnitStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { unitId } = req.params;

        // Find all classes that have this unit in their program
        const classesWithUnit = await prisma.class.findMany({
            where: {
                program: {
                    programUnits: {
                        some: {
                            unitId: unitId
                        }
                    }
                }
            },
            include: {
                studentEnrollments: {
                    where: {
                        status: 'enrolled'
                    },
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentNumber: true,
                                firstNameEn: true,
                                lastNameEn: true,
                                firstNameAr: true,
                                lastNameAr: true,
                                gender: true,
                                email: true,
                                phone: true,
                            }
                        },
                        class: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        // Flatten enrollments from all classes
        const enrollments = classesWithUnit.flatMap(cls => cls.studentEnrollments);

        // Remove duplicates (student might be in multiple classes for same unit)
        const uniqueEnrollments = enrollments.filter((enrollment, index, self) =>
            index === self.findIndex((e) => e.studentId === enrollment.studentId)
        );

        res.json({
            success: true,
            data: {
                enrollments: uniqueEnrollments,
                total: uniqueEnrollments.length
            }
        });
    } catch (error: any) {
        console.error('Get unit students error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching unit students'
            }
        });
    }
};

