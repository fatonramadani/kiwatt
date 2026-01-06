import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, count, desc, sql, ne } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMember } from "~/server/db/schema";

// Helper to verify org membership
async function verifyMembership(
  ctx: { db: any; session: { user: { id: string } } },
  orgId: string,
  requireAdmin = false
) {
  const membership = await ctx.db.query.organizationMember.findFirst({
    where: and(
      eq(organizationMember.organizationId, orgId),
      eq(organizationMember.userId, ctx.session.user.id)
    ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  if (requireAdmin && membership.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can perform this action",
    });
  }

  return membership;
}

export const memberRouter = createTRPCRouter({
  // List members with search/filter/pagination
  list: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "pending"]).optional(),
        installationType: z.enum(["consumer", "producer", "prosumer"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      // Build where conditions
      const conditions = [
        eq(organizationMember.organizationId, input.orgId),
        ne(organizationMember.podNumber, "ADMIN-POD"), // Exclude admin accounts
      ];

      if (input.status) {
        conditions.push(eq(organizationMember.status, input.status));
      }

      if (input.installationType) {
        conditions.push(eq(organizationMember.installationType, input.installationType));
      }

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: count() })
        .from(organizationMember)
        .where(and(...conditions));

      // Build search condition
      let whereClause = and(...conditions);
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        whereClause = and(
          ...conditions,
          or(
            ilike(organizationMember.firstname, searchTerm),
            ilike(organizationMember.lastname, searchTerm),
            ilike(organizationMember.email, searchTerm),
            ilike(organizationMember.podNumber, searchTerm)
          )
        );
      }

      // Get members
      const members = await ctx.db.query.organizationMember.findMany({
        where: whereClause,
        orderBy: [desc(organizationMember.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return {
        members,
        total: countResult?.count ?? 0,
        hasMore: (input.offset + members.length) < (countResult?.count ?? 0),
      };
    }),

  // Get single member by ID
  getById: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.query.organizationMember.findFirst({
        where: eq(organizationMember.id, input.memberId),
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      await verifyMembership(ctx, member.organizationId);

      return member;
    }),

  // Create new member
  create: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        firstname: z.string().min(1),
        lastname: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        podNumber: z.string().min(1),
        installationType: z.enum(["consumer", "producer", "prosumer"]),
        solarCapacityKwp: z.number().optional(),
        batteryCapacityKwh: z.number().optional(),
        priorityLevel: z.number().min(1).max(10).default(5),
        status: z.enum(["active", "inactive", "pending"]).default("pending"),
        role: z.enum(["admin", "member"]).default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      // Check if POD number already exists in this organization
      const existingPod = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.podNumber, input.podNumber)
        ),
      });

      if (existingPod) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A member with this POD number already exists",
        });
      }

      const memberId = createId();
      const { orgId, solarCapacityKwp, batteryCapacityKwh, ...memberData } = input;

      await ctx.db.insert(organizationMember).values({
        id: memberId,
        organizationId: orgId,
        ...memberData,
        solarCapacityKwp: solarCapacityKwp?.toString(),
        batteryCapacityKwh: batteryCapacityKwh?.toString(),
        joinedAt: new Date(),
      });

      return { id: memberId };
    }),

  // Update member
  update: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        firstname: z.string().min(1).optional(),
        lastname: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        podNumber: z.string().min(1).optional(),
        installationType: z.enum(["consumer", "producer", "prosumer"]).optional(),
        solarCapacityKwp: z.number().optional().nullable(),
        batteryCapacityKwh: z.number().optional().nullable(),
        priorityLevel: z.number().min(1).max(10).optional(),
        status: z.enum(["active", "inactive", "pending"]).optional(),
        role: z.enum(["admin", "member"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.query.organizationMember.findFirst({
        where: eq(organizationMember.id, input.memberId),
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      await verifyMembership(ctx, member.organizationId, true);

      // If updating POD number, check for conflicts
      if (input.podNumber && input.podNumber !== member.podNumber) {
        const existingPod = await ctx.db.query.organizationMember.findFirst({
          where: and(
            eq(organizationMember.organizationId, member.organizationId),
            eq(organizationMember.podNumber, input.podNumber)
          ),
        });

        if (existingPod) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A member with this POD number already exists",
          });
        }
      }

      const { memberId, solarCapacityKwp, batteryCapacityKwh, ...updates } = input;

      await ctx.db
        .update(organizationMember)
        .set({
          ...updates,
          solarCapacityKwp: solarCapacityKwp !== undefined
            ? (solarCapacityKwp?.toString() ?? null)
            : undefined,
          batteryCapacityKwh: batteryCapacityKwh !== undefined
            ? (batteryCapacityKwh?.toString() ?? null)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(organizationMember.id, memberId));

      return { success: true };
    }),

  // Delete member
  delete: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.query.organizationMember.findFirst({
        where: eq(organizationMember.id, input.memberId),
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      await verifyMembership(ctx, member.organizationId, true);

      // Prevent deleting yourself if you're the only admin
      if (member.userId === ctx.session.user.id) {
        const adminCount = await ctx.db
          .select({ count: count() })
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.organizationId, member.organizationId),
              eq(organizationMember.role, "admin")
            )
          );

        if ((adminCount[0]?.count ?? 0) <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete the only admin of the organization",
          });
        }
      }

      await ctx.db
        .delete(organizationMember)
        .where(eq(organizationMember.id, input.memberId));

      return { success: true };
    }),

  // Bulk create from CSV import
  bulkCreate: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        members: z.array(
          z.object({
            firstname: z.string().min(1),
            lastname: z.string().min(1),
            email: z.string().email(),
            phone: z.string().optional(),
            address: z.string().optional(),
            postalCode: z.string().optional(),
            city: z.string().optional(),
            podNumber: z.string().min(1),
            installationType: z.enum(["consumer", "producer", "prosumer"]),
            solarCapacityKwp: z.number().optional(),
            batteryCapacityKwh: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      // Get existing POD numbers
      const existingMembers = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
        columns: { podNumber: true },
      });
      const existingPods = new Set(existingMembers.map((m) => m.podNumber));

      // Validate and prepare members
      const errors: { row: number; error: string }[] = [];
      const validMembers: typeof input.members = [];
      const seenPods = new Set<string>();

      input.members.forEach((member, index) => {
        if (existingPods.has(member.podNumber)) {
          errors.push({ row: index + 1, error: `POD ${member.podNumber} already exists` });
        } else if (seenPods.has(member.podNumber)) {
          errors.push({ row: index + 1, error: `Duplicate POD ${member.podNumber} in import` });
        } else {
          seenPods.add(member.podNumber);
          validMembers.push(member);
        }
      });

      // Insert valid members
      if (validMembers.length > 0) {
        const values = validMembers.map((member) => ({
          id: createId(),
          organizationId: input.orgId,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          phone: member.phone,
          address: member.address,
          postalCode: member.postalCode,
          city: member.city,
          podNumber: member.podNumber,
          installationType: member.installationType as "consumer" | "producer" | "prosumer",
          solarCapacityKwp: member.solarCapacityKwp?.toString(),
          batteryCapacityKwh: member.batteryCapacityKwh?.toString(),
          status: "pending" as const,
          role: "member" as const,
          priorityLevel: 5,
          joinedAt: new Date(),
        }));

        await ctx.db.insert(organizationMember).values(values);
      }

      return {
        created: validMembers.length,
        errors,
        total: input.members.length,
      };
    }),
});
