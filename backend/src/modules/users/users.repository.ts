import prisma from '../../common/db/prisma';
import { Prisma } from '@prisma/client';

export class UsersRepository {
    // Find all users with pagination and filtering
    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    userRoles: {
                        include: {
                            role: true
                        }
                    }
                },
            }),
            prisma.user.count({ where })
        ]);

        return { users, total };
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async findByUsername(username: string) {
        return prisma.user.findUnique({ where: { username } });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
            include: {
                userRoles: { include: { role: true } }
            }
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            include: { userRoles: { include: { role: true } } }
        });
    }

    async delete(id: string) {
        return prisma.user.delete({ where: { id } });
    }
}

export const usersRepository = new UsersRepository();
