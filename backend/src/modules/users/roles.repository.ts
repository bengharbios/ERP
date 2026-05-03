import prisma from '../../common/db/prisma';
import { Prisma } from '@prisma/client';

export class RolesRepository {
    async findAll() {
        return prisma.role.findMany({
            include: {
                _count: {
                    select: {
                        rolePermissions: true,
                        userRoles: true
                    }
                },
                rolePermissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async findById(id: string) {
        return prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    include: {
                        permission: true
                    }
                },
                _count: {
                    select: { userRoles: true }
                }
            }
        });
    }

    async findByName(name: string) {
        return prisma.role.findUnique({ where: { name } });
    }

    async create(data: Prisma.RoleCreateInput) {
        return prisma.role.create({
            data,
            include: {
                rolePermissions: { include: { permission: true } }
            }
        });
    }

    async update(id: string, data: Prisma.RoleUpdateInput) {
        return prisma.role.update({
            where: { id },
            data,
            include: { rolePermissions: true }
        });
    }

    async delete(id: string) {
        return prisma.role.delete({ where: { id } });
    }

    // Role Permissions Management
    async addPermissions(roleId: string, permissionIds: string[]) {
        const data = permissionIds.map(permId => ({
            roleId,
            permissionId: permId
        }));

        // Use createMany if supported or simple map
        // createMany is supported in modern Prisma for relational DBs
        return prisma.rolePermission.createMany({
            data,
            skipDuplicates: true
        });
    }

    async removePermissions(roleId: string, permissionIds: string[]) {
        return prisma.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId: { in: permissionIds }
            }
        });
    }
}

export const rolesRepository = new RolesRepository();
