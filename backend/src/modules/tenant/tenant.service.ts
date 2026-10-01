import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { CreateTenantDto } from "./tenant.types";

const prisma = new PrismaClient();

export class TenantService {
  /**
   * Creates a new tenant and immediately creates the admin user for that tenant.
   * This operation is done inside a transaction to ensure both are created or none.
   */
  async createTenantWithAdmin(data: CreateTenantDto) {
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug: data.slug }
    });

    if (existingSlug) {
      throw new Error("Slug already exists");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail }
    });

    if (existingUser) {
      throw new Error("Admin email already registered in the system");
    }

    // Usually we hash password here: const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
    // Assuming you have bcrypt installed. Since I am unsure, we use a basic fallback or we use bcrypt.
    // In this codebase, 'bcrypt' or similar is likely available. Let's use it.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.adminPassword, saltRounds);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          domain: data.domain,
        }
      });

      // 2. Create Admin User for this Tenant
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          username: `admin_${data.slug}`, // Generates a unique username
          passwordHash: hashedPassword,
          firstName: data.adminFullName?.split(' ')[0] || "Admin",
          lastName: data.adminFullName?.split(' ').slice(1).join(' ') || "",
          tenantId: tenant.id,
          isActive: true
        }
      });

      // 3. Assign Institute Admin Role
      let adminRole = await tx.role.findUnique({ where: { name: "INSTITUTE_ADMIN" } });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: { name: "INSTITUTE_ADMIN", description: "Admin for a specific Institute", isSystemRole: true }
        });
      }

      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
          scopeType: "TENANT",
          scopeId: tenant.id
        }
      });

      return { tenant, adminUser };
    });

    return result;
  }

  async getAllTenants() {
    return prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }
}
