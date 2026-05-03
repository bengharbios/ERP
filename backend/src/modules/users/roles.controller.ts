import { Request, Response } from 'express';
import { rolesService } from './roles.service';

export const getRoles = async (_req: Request, res: Response) => {
    try {
        console.log('🔍 Controller: Fetching all roles...');
        const roles = await rolesService.getAllRoles();
        console.log(`✅ Controller: Found ${roles.length} roles`);

        res.json({
            success: true,
            data: { roles }
        });
    } catch (error: any) {
        console.error('❌ Controller Error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ROLES_ERROR',
                message: error.message
            }
        });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const role = await rolesService.createRole(req.body);
        res.status(201).json({
            success: true,
            data: { role }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: {
                code: 'CREATE_ROLE_ERROR',
                message: error.message
            }
        });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const role = await rolesService.updateRole(req.params.id, req.body);
        res.json({
            success: true,
            data: { role }
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: {
                code: 'UPDATE_ROLE_ERROR',
                message: error.message
            }
        });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        await rolesService.deleteRole(req.params.id);
        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: {
                code: 'DELETE_ROLE_ERROR',
                message: error.message
            }
        });
    }
};
