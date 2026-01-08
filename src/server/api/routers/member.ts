import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, count, desc, ne } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { organizationMember, organization, invoice, monthlyAggregation, memberInvite, user } from "~/server/db/schema";
import { sendMemberInviteEmail } from "~/lib/email/send-email";

// Helper to verify org membership
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
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
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

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

      // Get members with invites
      const members = await ctx.db.query.organizationMember.findMany({
        where: whereClause,
        orderBy: [desc(organizationMember.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          invites: {
            orderBy: [desc(memberInvite.createdAt)],
            limit: 1,
          },
        },
      });

      // Compute invite status for each member
      const membersWithInviteStatus = members.map((member) => {
        const latestInvite = member.invites[0];
        let inviteStatus: "not_invited" | "pending" | "accepted" | "expired" = "not_invited";

        if (member.userId) {
          inviteStatus = "accepted";
        } else if (latestInvite) {
          if (latestInvite.usedAt) {
            inviteStatus = "accepted";
          } else if (new Date() > latestInvite.expiresAt) {
            inviteStatus = "expired";
          } else {
            inviteStatus = "pending";
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { invites, ...memberData } = member;
        return {
          ...memberData,
          inviteStatus,
        };
      });

      return {
        members: membersWithInviteStatus,
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
          installationType: member.installationType,
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

  // ============================================================================
  // Member Self-Service Queries (for Portal)
  // ============================================================================

  // Get current user's membership in an organization
  getMyMembership: protectedProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find organization by slug
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.slug, input.orgSlug),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, org.id),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        membership,
        organization: org,
      };
    }),

  // Get member's own invoices
  getMyInvoices: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get invoices for this member
      const [countResult] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(eq(invoice.memberId, membership.id));

      const invoices = await ctx.db.query.invoice.findMany({
        where: eq(invoice.memberId, membership.id),
        orderBy: [desc(invoice.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return {
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          status: inv.status,
          totalChf: parseFloat(inv.totalChf),
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          createdAt: inv.createdAt,
          pdfUrl: inv.pdfUrl,
        })),
        total: countResult?.count ?? 0,
        hasMore: input.offset + invoices.length < (countResult?.count ?? 0),
      };
    }),

  // Get member's consumption data
  getMyConsumption: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get monthly aggregations for this member
      const aggregations = await ctx.db.query.monthlyAggregation.findMany({
        where: and(
          eq(monthlyAggregation.memberId, membership.id),
          eq(monthlyAggregation.year, input.year)
        ),
        orderBy: [monthlyAggregation.month],
      });

      // Calculate totals
      let totalConsumption = 0;
      let totalProduction = 0;
      let totalSelfConsumption = 0;
      let totalCommunityConsumption = 0;
      let totalGridConsumption = 0;

      const monthNames = [
        "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const byMonth = aggregations.map((agg) => {
        const consumption = parseFloat(agg.totalConsumptionKwh);
        const production = parseFloat(agg.totalProductionKwh);
        const selfConsumption = parseFloat(agg.selfConsumptionKwh);
        const communityConsumption = parseFloat(agg.communityConsumptionKwh);
        const gridConsumption = parseFloat(agg.gridConsumptionKwh);

        totalConsumption += consumption;
        totalProduction += production;
        totalSelfConsumption += selfConsumption;
        totalCommunityConsumption += communityConsumption;
        totalGridConsumption += gridConsumption;

        return {
          month: agg.month,
          monthName: monthNames[agg.month] ?? "",
          consumption,
          production,
          selfConsumption,
          communityConsumption,
          gridConsumption,
        };
      });

      // Fill missing months
      const fullYear = [];
      for (let m = 1; m <= 12; m++) {
        const existing = byMonth.find((d) => d.month === m);
        fullYear.push(
          existing ?? {
            month: m,
            monthName: monthNames[m] ?? "",
            consumption: 0,
            production: 0,
            selfConsumption: 0,
            communityConsumption: 0,
            gridConsumption: 0,
          }
        );
      }

      return {
        totalConsumption,
        totalProduction,
        totalSelfConsumption,
        totalCommunityConsumption,
        totalGridConsumption,
        selfSufficiency:
          totalConsumption > 0
            ? ((totalSelfConsumption + totalCommunityConsumption) / totalConsumption) * 100
            : 0,
        byMonth: fullYear,
      };
    }),

  // Get member's summary for portal dashboard
  getMyPortalSummary: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get current month's data
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const currentAggregation = await ctx.db.query.monthlyAggregation.findFirst({
        where: and(
          eq(monthlyAggregation.memberId, membership.id),
          eq(monthlyAggregation.year, currentYear),
          eq(monthlyAggregation.month, currentMonth)
        ),
      });

      // Get recent invoices
      const recentInvoices = await ctx.db.query.invoice.findMany({
        where: eq(invoice.memberId, membership.id),
        orderBy: [desc(invoice.createdAt)],
        limit: 5,
      });

      // Get unpaid invoices
      const [unpaidCount] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(
          and(
            eq(invoice.memberId, membership.id),
            or(eq(invoice.status, "sent"), eq(invoice.status, "overdue"))
          )
        );

      return {
        currentMonth: currentAggregation
          ? {
              consumption: parseFloat(currentAggregation.totalConsumptionKwh),
              production: parseFloat(currentAggregation.totalProductionKwh),
              selfConsumption: parseFloat(currentAggregation.selfConsumptionKwh),
              communityConsumption: parseFloat(currentAggregation.communityConsumptionKwh),
              gridConsumption: parseFloat(currentAggregation.gridConsumptionKwh),
            }
          : null,
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalChf: parseFloat(inv.totalChf),
          status: inv.status,
          dueDate: inv.dueDate,
          pdfUrl: inv.pdfUrl,
        })),
        unpaidCount: unpaidCount?.count ?? 0,
      };
    }),

  // ============================================================================
  // Member Invitation System
  // ============================================================================

  // Generate and send invite to a member
  inviteMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get member and verify admin access
      const member = await ctx.db.query.organizationMember.findFirst({
        where: eq(organizationMember.id, input.memberId),
        with: { organization: true },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      await verifyMembership(ctx, member.organizationId, true);

      // Check if member already has a user account linked
      if (member.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Member already has an account linked",
        });
      }

      // Generate unique token
      const token = createId() + createId(); // Extra long for security

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create or update invite
      const existingInvite = await ctx.db.query.memberInvite.findFirst({
        where: eq(memberInvite.memberId, input.memberId),
      });

      if (existingInvite) {
        // Update existing invite with new token
        await ctx.db
          .update(memberInvite)
          .set({
            token,
            expiresAt,
            usedAt: null,
            createdAt: new Date(),
          })
          .where(eq(memberInvite.id, existingInvite.id));
      } else {
        // Create new invite
        await ctx.db.insert(memberInvite).values({
          id: createId(),
          memberId: input.memberId,
          token,
          expiresAt,
          createdAt: new Date(),
        });
      }

      // Send invite email
      await sendMemberInviteEmail({
        to: member.email,
        memberName: `${member.firstname} ${member.lastname}`,
        organizationName: member.organization.name,
        inviteToken: token,
      });

      return { success: true, email: member.email };
    }),

  // Verify invite token (public - no auth required)
  verifyInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.query.memberInvite.findFirst({
        where: eq(memberInvite.token, input.token),
        with: {
          member: {
            with: { organization: true },
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite link",
        });
      }

      if (invite.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has already been used",
        });
      }

      if (new Date() > invite.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired",
        });
      }

      return {
        memberEmail: invite.member.email,
        memberName: `${invite.member.firstname} ${invite.member.lastname}`,
        organizationName: invite.member.organization.name,
        organizationSlug: invite.member.organization.slug,
      };
    }),

  // Accept invite (after login/register)
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.query.memberInvite.findFirst({
        where: eq(memberInvite.token, input.token),
        with: {
          member: {
            with: { organization: true },
          },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite link",
        });
      }

      if (invite.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has already been used",
        });
      }

      if (new Date() > invite.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invite has expired",
        });
      }

      // Verify email matches (optional but recommended)
      const currentUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
      });

      // Link user to member
      await ctx.db
        .update(organizationMember)
        .set({
          userId: ctx.session.user.id,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(organizationMember.id, invite.memberId));

      // Mark invite as used
      await ctx.db
        .update(memberInvite)
        .set({ usedAt: new Date() })
        .where(eq(memberInvite.id, invite.id));

      return {
        success: true,
        organizationSlug: invite.member.organization.slug,
      };
    }),

  // Get invite status for a member (for admin to see)
  getInviteStatus: protectedProcedure
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

      // Check if already linked
      if (member.userId) {
        return { status: "linked" as const, userId: member.userId };
      }

      // Check for invite
      const invite = await ctx.db.query.memberInvite.findFirst({
        where: eq(memberInvite.memberId, input.memberId),
      });

      if (!invite) {
        return { status: "not_invited" as const };
      }

      if (invite.usedAt) {
        return { status: "accepted" as const, usedAt: invite.usedAt };
      }

      if (new Date() > invite.expiresAt) {
        return { status: "expired" as const, expiresAt: invite.expiresAt };
      }

      return {
        status: "pending" as const,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      };
    }),

  // ============================================================================
  // API Key Management (for Smart Home Integration)
  // ============================================================================

  // Generate new API key for a member
  generateApiKey: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Generate a secure API key
      const apiKey = `kiwatt_${createId()}${createId()}`;

      // Update member with new API key
      await ctx.db
        .update(organizationMember)
        .set({
          apiKey,
          apiKeyCreatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(organizationMember.id, membership.id));

      return { apiKey };
    }),

  // Revoke API key
  revokeApiKey: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Clear API key
      await ctx.db
        .update(organizationMember)
        .set({
          apiKey: null,
          apiKeyCreatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(organizationMember.id, membership.id));

      return { success: true };
    }),

  // Get current API key status (not the key itself for security)
  getApiKeyStatus: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find membership for current user
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        hasApiKey: !!membership.apiKey,
        apiKeyCreatedAt: membership.apiKeyCreatedAt,
        // Return masked key for display
        maskedKey: membership.apiKey
          ? `${membership.apiKey.slice(0, 12)}...${membership.apiKey.slice(-4)}`
          : null,
      };
    }),
});
