import { rolesRepository } from './roles.repository';
import { Prisma } from '@prisma/client';

export class RolesService {
    async getAllRoles() {
        return rolesRepository.findAll();
    }

    async getRoleById(id: string) {
        const role = await rolesRepository.findById(id);
        if (!role) throw new Error('Role not found');
        return role;
    }

    async createRole(data: { name: string; description?: string; permissionIds?: string[] }) {
        const exists = await rolesRepository.findByName(data.name);
        if (exists) throw new Error('Role name already exists');

        const roleData: Prisma.RoleCreateInput = {
            name: data.name,
            description: data.description,
            isSystemRole: false
        };

        if (data.permissionIds && data.permissionIds.length > 0) {
            roleData.rolePermissions = {
                create: data.permissionIds.map(pid => ({
                    permission: { connect: { id: pid } }
                }))
            };
        }

        return rolesRepository.create(roleData);
    }

    async updateRole(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
        const role = await rolesRepository.findById(id);
        if (!role) throw new Error('Role not found');

        if (role.isSystemRole && data.name && data.name !== role.name) {
            throw new Error('Cannot change name of a system role');
        }

        const updateData: Prisma.RoleUpdateInput = {
            name: data.name,
            description: data.description,
        };

        // Handle permissions update if provided
        if (data.permissionIds) {
            // Transactional update: delete old, add new
            // This is complex with just one 'update' call unless using set/connect/disconnect
            // The cleanest way is to use the Repo's dedicated methods or Prisma's deleteMany/createMany

            // 1. Update basic info
            await rolesRepository.update(id, updateData);

            // 2. Sync permissions (Remove all, then add new) -> A bit nuclear but safe for full sync
            // Better: Find diff. For simplicity in this 'rewrite', let's use the repo helpers.
            const currentPerms = role.rolePermissions.map(rp => rp.permissionId);

            const toAdd = data.permissionIds.filter(pid => !currentPerms.includes(pid));
            const toRemove = currentPerms.filter(pid => !data.permissionIds!.includes(pid));

            if (toRemove.length > 0) await rolesRepository.removePermissions(id, toRemove);
            if (toAdd.length > 0) await rolesRepository.addPermissions(id, toAdd);

            return rolesRepository.findById(id);
        }

        return rolesRepository.update(id, updateData);
    }

    async deleteRole(id: string) {
        const role = await rolesRepository.findById(id);
        if (!role) throw new Error('Role not found');

        if (role.isSystemRole) {
            throw new Error('Cannot delete a system role');
        }

        if (role._count.userRoles > 0) {
            throw new Error('Cannot delete role assigned to users');
        }

        return rolesRepository.delete(id);
    }
}

export const rolesService = new RolesService();
