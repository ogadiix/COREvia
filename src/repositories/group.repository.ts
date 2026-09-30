/**
 * COREvia Phase 34: Household & Business Group 360 Repository
 * Data-access layer for relationship groups, member relationships, and portfolio queries.
 */

import { db } from '../db/index.ts';
import {
  relationshipGroups,
  relationshipGroupMembers,
  customers,
  users,
} from '../db/schema.ts';
import { eq, and, or, ilike, inArray, SQL, desc } from 'drizzle-orm';
import {
  GroupType,
  GroupStatus,
  GroupFilterParams,
  GroupAnalyticsDTO,
} from '../types/group.types.ts';

export const groupRepository = {
  /**
   * Retrieves groups with optional filtering, search, and pagination
   */
  async getGroups(params: GroupFilterParams = {}, allowedGroupIds?: number[]) {
    const conditions: SQL[] = [];

    if (allowedGroupIds && allowedGroupIds.length > 0) {
      conditions.push(inArray(relationshipGroups.id, allowedGroupIds));
    } else if (allowedGroupIds && allowedGroupIds.length === 0) {
      return [];
    }

    if (params.groupType) {
      conditions.push(eq(relationshipGroups.groupType, params.groupType));
    }

    if (params.status) {
      conditions.push(eq(relationshipGroups.status, params.status));
    }

    if (params.relationshipManagerId) {
      conditions.push(eq(relationshipGroups.relationshipManagerId, params.relationshipManagerId));
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(relationshipGroups.groupId, q),
          ilike(relationshipGroups.name, q),
          ilike(relationshipGroups.displayName, q),
          ilike(relationshipGroups.description, q)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.query.relationshipGroups.findMany({
      where: whereClause,
      with: {
        primaryCustomer: true,
        relationshipManager: true,
        members: true,
      },
      orderBy: [desc(relationshipGroups.createdAt)],
      limit: params.limit || 50,
      offset: params.offset || 0,
    });
  },

  /**
   * Retrieves single group by primary key ID with relations
   */
  async getGroupById(id: number) {
    return await db.query.relationshipGroups.findFirst({
      where: eq(relationshipGroups.id, id),
      with: {
        primaryCustomer: true,
        relationshipManager: true,
        members: true,
      },
    });
  },

  /**
   * Retrieves single group by unique groupId code (e.g. HH-10482, BIZ-10482)
   */
  async getGroupByGroupId(groupId: string) {
    return await db.query.relationshipGroups.findFirst({
      where: eq(relationshipGroups.groupId, groupId),
      with: {
        primaryCustomer: true,
        relationshipManager: true,
        members: true,
      },
    });
  },

  /**
   * Inserts a new relationship group
   */
  async createGroup(data: {
    groupId: string;
    groupType: GroupType;
    name: string;
    displayName: string;
    description?: string | null;
    status?: GroupStatus;
    primaryCustomerId?: number | null;
    primaryBusinessId?: string | null;
    relationshipManagerId?: number | null;
    metadata?: Record<string, any> | null;
  }) {
    const [inserted] = await db
      .insert(relationshipGroups)
      .values({
        groupId: data.groupId,
        groupType: data.groupType,
        name: data.name,
        displayName: data.displayName,
        description: data.description || null,
        status: data.status || 'ACTIVE',
        primaryCustomerId: data.primaryCustomerId || null,
        primaryBusinessId: data.primaryBusinessId || null,
        relationshipManagerId: data.relationshipManagerId || null,
        metadata: data.metadata || {},
      })
      .returning();

    return inserted;
  },

  /**
   * Updates an existing relationship group
   */
  async updateGroup(id: number, data: Partial<{
    name: string;
    displayName: string;
    description: string | null;
    status: GroupStatus;
    primaryCustomerId: number | null;
    primaryBusinessId: string | null;
    relationshipManagerId: number | null;
    metadata: Record<string, any> | null;
  }>) {
    const [updated] = await db
      .update(relationshipGroups)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(relationshipGroups.id, id))
      .returning();

    return updated;
  },

  /**
   * Retrieves all members of a group
   */
  async getGroupMembers(groupId: number) {
    return await db
      .select()
      .from(relationshipGroupMembers)
      .where(eq(relationshipGroupMembers.groupId, groupId));
  },

  /**
   * Inserts a member into a relationship group
   */
  async addGroupMember(data: {
    groupId: number;
    entityType: string;
    entityId: string;
    role: string;
    relationshipType: string;
    ownershipPercentage?: number | null;
    isPrimary?: boolean;
    validFrom?: string | null;
    validTo?: string | null;
    metadata?: Record<string, any> | null;
  }) {
    const [member] = await db
      .insert(relationshipGroupMembers)
      .values({
        groupId: data.groupId,
        entityType: data.entityType,
        entityId: data.entityId,
        role: data.role,
        relationshipType: data.relationshipType,
        ownershipPercentage: data.ownershipPercentage ? String(data.ownershipPercentage) : null,
        isPrimary: data.isPrimary ?? false,
        validFrom: data.validFrom ? data.validFrom : null,
        validTo: data.validTo ? data.validTo : null,
        metadata: data.metadata || {},
      })
      .returning();

    return member;
  },

  /**
   * Removes a member from a relationship group
   */
  async removeGroupMember(memberId: number) {
    const [removed] = await db
      .delete(relationshipGroupMembers)
      .where(eq(relationshipGroupMembers.id, memberId))
      .returning();

    return removed;
  },

  /**
   * Finds all groups that an entity belongs to
   */
  async getGroupsForEntity(entityType: string, entityId: string) {
    const memberRows = await db
      .select({ groupId: relationshipGroupMembers.groupId })
      .from(relationshipGroupMembers)
      .where(
        and(
          eq(relationshipGroupMembers.entityType, entityType),
          eq(relationshipGroupMembers.entityId, entityId)
        )
      );

    if (memberRows.length === 0) return [];

    const groupIds = memberRows.map((r) => r.groupId);
    return await db.query.relationshipGroups.findMany({
      where: inArray(relationshipGroups.id, groupIds),
      with: {
        primaryCustomer: true,
        relationshipManager: true,
        members: true,
      },
    });
  },

  /**
   * Aggregates portfolio-wide group analytics
   */
  async getPortfolioAnalytics(allowedGroupIds?: number[]): Promise<GroupAnalyticsDTO> {
    const conditions: SQL[] = [];
    if (allowedGroupIds && allowedGroupIds.length > 0) {
      conditions.push(inArray(relationshipGroups.id, allowedGroupIds));
    } else if (allowedGroupIds && allowedGroupIds.length === 0) {
      return {
        totalGroups: 0,
        totalHouseholds: 0,
        totalBusinessGroups: 0,
        totalGroupRelationshipValue: 0,
        formattedTotalValue: '₹0.0L',
        avgMembersPerGroup: 0,
        openCasesAcrossGroups: 0,
        pipelineValueAcrossGroups: 0,
        activeJourneysAcrossGroups: 0,
        byType: [],
        byStatus: {},
        topGroupsByValue: [],
      };
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const allGroups = await db.query.relationshipGroups.findMany({
      where: whereClause,
      with: {
        primaryCustomer: true,
        members: true,
      },
    });

    const totalGroups = allGroups.length;
    let totalHouseholds = 0;
    let totalBusinessGroups = 0;
    let totalMembersSum = 0;

    const byStatus: Record<string, number> = {};
    const typeCountMap: Record<string, { count: number; value: number }> = {
      HOUSEHOLD: { count: 0, value: 0 },
      BUSINESS: { count: 0, value: 0 },
      BUSINESS_GROUP: { count: 0, value: 0 },
    };

    for (const g of allGroups) {
      byStatus[g.status] = (byStatus[g.status] || 0) + 1;
      if (g.groupType === 'HOUSEHOLD') totalHouseholds++;
      if (g.groupType === 'BUSINESS_GROUP' || g.groupType === 'BUSINESS') totalBusinessGroups++;

      const memberCount = g.members?.length || 0;
      totalMembersSum += memberCount;

      if (!typeCountMap[g.groupType]) {
        typeCountMap[g.groupType] = { count: 0, value: 0 };
      }
      typeCountMap[g.groupType].count++;
    }

    const avgMembersPerGroup =
      totalGroups > 0 ? Math.round((totalMembersSum / totalGroups) * 10) / 10 : 0;

    const byType = Object.entries(typeCountMap).map(([type, stats]) => ({
      type: type as GroupType,
      label: type === 'HOUSEHOLD' ? 'Households' : type === 'BUSINESS_GROUP' ? 'Business Groups' : 'Businesses',
      count: stats.count,
      value: stats.value,
    }));

    return {
      totalGroups,
      totalHouseholds,
      totalBusinessGroups,
      totalGroupRelationshipValue: 0,
      formattedTotalValue: '₹0.0L',
      avgMembersPerGroup,
      openCasesAcrossGroups: 0,
      pipelineValueAcrossGroups: 0,
      activeJourneysAcrossGroups: 0,
      byType,
      byStatus,
      topGroupsByValue: [],
    };
  },
};
