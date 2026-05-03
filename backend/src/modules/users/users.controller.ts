import { Request, Response } from 'express';
import { usersService } from './users.service';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const search = req.query.search as string;
        const roleId = req.query.roleId as string;

        const result = await usersService.getAllUsers({ page, limit, search, roleId });

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_USERS_ERROR',
                message: error.message || 'Failed to fetch users'
            }
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await usersService.getUserById(req.params.id);
        return res.json({
            success: true,
            data: { user }
        });
    } catch (error: any) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: error.message
            }
        });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        // TODO: Add Zod validation here
        const user = await usersService.createUser(req.body);
        return res.status(201).json({
            success: true,
            data: { user }
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'CREATE_USER_ERROR',
                message: error.message
            }
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await usersService.updateUser(req.params.id, req.body);
        return res.json({
            success: true,
            data: { user }
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPDATE_USER_ERROR',
                message: error.message
            }
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await usersService.deleteUser(req.params.id);
        return res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DELETE_USER_ERROR',
                message: error.message
            }
        });
    }
};
