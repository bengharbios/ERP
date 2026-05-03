import { Router } from 'express';
// import { authenticateToken, checkPermission } from '../../middleware/auth'; // Uncomment when ready
import * as usersController from './users.controller';
import * as rolesController from './roles.controller';
import prisma from '../../common/db/prisma'; // Temporary for permissions

const router = Router();

// Middleware placeholder (Enable later)
const authenticateToken = (_req: any, _res: any, next: any) => next();

// --- USERS ROUTES ---
router.get('/users', authenticateToken, usersController.getUsers);
router.post('/users', authenticateToken, usersController.createUser);
router.get('/users/:id', authenticateToken, usersController.getUserById);
router.put('/users/:id', authenticateToken, usersController.updateUser);
router.delete('/users/:id', authenticateToken, usersController.deleteUser);

// --- ROLES ROUTES ---
router.get('/roles', authenticateToken, rolesController.getRoles);
router.post('/roles', authenticateToken, rolesController.createRole);
router.put('/roles/:id', authenticateToken, rolesController.updateRole);
router.delete('/roles/:id', authenticateToken, rolesController.deleteRole);

// --- PERMISSIONS ROUTES (Simple direct access for now) ---
router.get('/permissions', authenticateToken, async (_req, res) => {
    try {
        const permissions = await prisma.permission.findMany({ orderBy: { resource: 'asc' } });
        // Deduce resources
        const resources = [...new Set(permissions.map(p => p.resource))];
        res.json({ success: true, data: { permissions, resources } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
