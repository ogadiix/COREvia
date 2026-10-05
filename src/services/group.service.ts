/**
 * COREvia Phase 34: Household & Business Group 360 Service
 * Governed group relationship intelligence layer managing households, corporate groups,
 * strict dual-level authorization (group + per-member IDOR defense), multidimensional
 * group profiles, unified timelines, and AI integrations.
 */

import { groupRepository } from '../repositories/group.repository.ts';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationService } from './notification.service.ts';
import { decisionTraceService } from './decisionTrace.service.ts';
import { journeyService } from './journey.service.ts';
import { SafeUser } from './auth.service.ts';
import { BankingError } from '../lib/errors.ts';
import { db } from '../db/index.ts';
import {
  relationshipGroups,
  relationshipGroupMembers,
  relationshipEdges,
  customers,
  users,
  accounts,
  loans,
  products,
  customerProducts,
  serviceCases,
  opportunities,
  interactions,
  customerOpportunityRadar,
  customerScores,
} from '../db/schema.ts';
import { eq, and, or, inArray, desc, sql, ne } from 'drizzle-orm';
import {
  GroupType,
  GroupStatus,
  GroupRelationshipType,
  GroupFilterParams,
  RelationshipGroupDTO,
  GroupMemberDTO,
  GroupProfileDTO,
  GroupTimelineEventDTO,
  GroupAnalyticsDTO,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddGroupMemberPayload,
  HandoffGroupPayload,
} from '../types/group.types.ts';

export const groupService = {
  /**
   * Resolves a relationship group by either numeric primary key ID or groupId string code
   */
  async resolveGroup(idOrGroupId: number | string) {
    const numId = Number(idOrGroupId);
    if (!isNaN(numId)) {
      const byId = await groupRepository.getGroupById(numId);
      if (byId) return byId;
    }
    if (typeof idOrGroupId === 'string' || typeof idOrGroupId === 'number') {
      return await groupRepository.getGroupByGroupId(String(idOrGroupId));
    }
    return null;
  },

  /**
   * Verifies if the authenticated user has rights to inspect customer-level protected details
   */
  async canAccessCustomer(user: SafeUser, customerId: number): Promise<boolean> {
    if (!user) return false;
    if (
      user.role === 'ADMINISTRATOR' ||
      user.role === 'BRANCH_MANAGER' ||
      user.role === 'ANALYST' ||
      user.role === 'COMPLIANCE_OFFICER' ||
      user.role === 'AUDITOR'
    ) {
      return true;
    }
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const [c] = await db
        .select({ id: customers.id, assignedRmId: customers.assignedRmId })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      return !!c && (!c.assignedRmId || c.assignedRmId === user.id);
    }
    return true;
  },

  /**
   * Authorizes group-level access.
   * Access to a group allows viewing the group structure, but nested member records
   * are still subject to individual resource authorization.
   */
  async authorizeGroup(
    user: SafeUser,
    group: any,
    action: string = 'GROUP_READ',
    requestId: string = 'REQ-GROUP-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    if (
      user.role === 'ADMINISTRATOR' ||
      user.role === 'BRANCH_MANAGER' ||
      user.role === 'ANALYST' ||
      user.role === 'COMPLIANCE_OFFICER' ||
      user.role === 'AUDITOR'
    ) {
      return true;
    }

    if (user.role === 'RELATIONSHIP_MANAGER') {
      // Allowed if assigned as group RM
      if (group.relationshipManagerId === user.id) {
        return true;
      }
      // Allowed if assigned as RM for primary customer
      if (group.primaryCustomerId) {
        const canPrimary = await this.canAccessCustomer(user, group.primaryCustomerId);
        if (canPrimary) return true;
      }
      // Allowed if assigned as RM for any member
      const memberRows = await groupRepository.getGroupMembers(group.id);
      for (const m of memberRows) {
        if (m.entityType === 'CUSTOMER') {
          const numId = Number(m.entityId);
          if (!isNaN(numId)) {
            const canMember = await this.canAccessCustomer(user, numId);
            if (canMember) return true;
          }
        }
      }

      await auditRepository.createLog({
        actorId: user.employeeId || String(user.id),
        actorName: user.name,
        action: 'SECURITY_IDOR_VIOLATION',
        resourceType: 'RELATIONSHIP_GROUP',
        resourceId: group.groupId,
        requestId,
        outcome: 'FAILURE',
        metadata: { reason: 'Unauthorized access attempt to relationship group' },
      });

      throw new BankingError(
        'FORBIDDEN_SCOPE',
        `Access denied: You are not authorized to view group '${group.groupId}'.`,
        403
      );
    }

    if (!user.permissions.includes('groups:read') && !user.permissions.includes('admin:all')) {
      throw new BankingError(
        'FORBIDDEN',
        `Role '${user.role}' is not authorized to access relationship groups.`,
        403
      );
    }

    return true;
  },

  /**
   * Lists relationship groups with RBAC filtering
   */
  async listGroups(
    params: GroupFilterParams = {},
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipGroupDTO[]> {
    let allowedGroupIds: number[] | undefined = undefined;

    if (user.role === 'RELATIONSHIP_MANAGER') {
      const allGroups = await db.query.relationshipGroups.findMany({
        with: { members: true },
      });
      const authorizedIds: number[] = [];
      for (const g of allGroups) {
        try {
          await this.authorizeGroup(user, g, 'GROUP_LIST', requestId);
          authorizedIds.push(g.id);
        } catch {
          // not authorized
        }
      }
      allowedGroupIds = authorizedIds;
    }

    const groups = await groupRepository.getGroups(params, allowedGroupIds);

    const results: RelationshipGroupDTO[] = [];
    for (const g of groups) {
      const memberRows = g.members || [];
      let authorizedCount = 0;
      let hasRestricted = false;

      const membersDto: GroupMemberDTO[] = [];
      for (const m of memberRows) {
        let isAuth = true;
        let custName = m.role;
        let custCode: string | undefined = undefined;
        let cifNumber: string | undefined = undefined;
        let score: number | null = null;
        let relVal: number | null = null;

        if (m.entityType === 'CUSTOMER') {
          const numId = Number(m.entityId);
          if (!isNaN(numId)) {
            isAuth = await this.canAccessCustomer(user, numId);
            const [cust] = await db
              .select()
              .from(customers)
              .where(eq(customers.id, numId))
              .limit(1);

            if (cust) {
              if (isAuth) {
                custName = cust.name;
                custCode = cust.customerCode;
                cifNumber = cust.cifNumber;
                relVal = cust.relationshipValue ? Number(cust.relationshipValue) : null;
                const [sc] = await db
                  .select()
                  .from(customerScores)
                  .where(eq(customerScores.customerId, cust.id))
                  .limit(1);
                score = sc ? sc.coreScore : cust.cibilScore || null;
              } else {
                custName = 'Protected Member (Restricted Access)';
                hasRestricted = true;
              }
            }
          }
        } else if (m.entityType === 'BUSINESS') {
          custName = m.role ? `${m.role} (${m.entityId})` : m.entityId;
        }

        if (isAuth) authorizedCount++;

        membersDto.push({
          id: m.id,
          groupId: m.groupId,
          entityType: m.entityType as any,
          entityId: m.entityId,
          role: m.role,
          relationshipType: m.relationshipType as any,
          ownershipPercentage: m.ownershipPercentage ? Number(m.ownershipPercentage) : null,
          isPrimary: m.isPrimary,
          validFrom: m.validFrom ? String(m.validFrom) : null,
          validTo: m.validTo ? String(m.validTo) : null,
          name: custName,
          code: custCode,
          cifNumber,
          isAuthorized: isAuth,
          coreScore: score,
          relationshipValue: relVal,
        });
      }

      results.push({
        id: g.id,
        groupId: g.groupId,
        groupType: g.groupType as GroupType,
        name: g.name,
        displayName: g.displayName,
        description: g.description,
        status: g.status as GroupStatus,
        primaryCustomerId: g.primaryCustomerId,
        primaryCustomerName: g.primaryCustomer?.name,
        primaryCustomerCode: g.primaryCustomer?.customerCode,
        primaryBusinessId: g.primaryBusinessId,
        relationshipManagerId: g.relationshipManagerId,
        relationshipManagerName: g.relationshipManager?.name,
        relationshipManagerRole: g.relationshipManager?.role,
        totalMembersCount: memberRows.length,
        authorizedMembersCount: authorizedCount,
        hasRestrictedMembers: hasRestricted,
        members: membersDto,
        metadata: g.metadata as any,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      });
    }

    return results;
  },

  /**
   * Retrieves single group details, members, and aggregated relationship profile
   */
  async getGroup(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipGroupDTO> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_READ', requestId);

    // Audit log
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'GROUP_VIEWED',
      resourceType: 'RELATIONSHIP_GROUP',
      resourceId: group.groupId,
      requestId,
      outcome: 'SUCCESS',
    });

    const profile = await this.getGroupProfile(group.id, user, requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedMembersCount = members.filter((m) => m.isAuthorized).length;
    const hasRestrictedMembers = members.some((m) => !m.isAuthorized);

    return {
      id: group.id,
      groupId: group.groupId,
      groupType: group.groupType as GroupType,
      name: group.name,
      displayName: group.displayName,
      description: group.description,
      status: group.status as GroupStatus,
      primaryCustomerId: group.primaryCustomerId,
      primaryCustomerName: group.primaryCustomer?.name,
      primaryCustomerCode: group.primaryCustomer?.customerCode,
      primaryBusinessId: group.primaryBusinessId,
      relationshipManagerId: group.relationshipManagerId,
      relationshipManagerName: group.relationshipManager?.name,
      relationshipManagerRole: group.relationshipManager?.role,
      totalMembersCount: members.length,
      authorizedMembersCount,
      hasRestrictedMembers,
      members,
      profile,
      metadata: group.metadata as any,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  },

  /**
   * Retrieves group members with explicit member-level resource authorization filtering
   */
  async getGroupMembers(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ): Promise<GroupMemberDTO[]> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_MEMBERS_READ', requestId);

    const rawMembers = await groupRepository.getGroupMembers(group.id);
    const result: GroupMemberDTO[] = [];

    for (const m of rawMembers) {
      let isAuth = true;
      let name = m.role;
      let code: string | undefined = undefined;
      let cifNumber: string | undefined = undefined;
      let score: number | null = null;
      let relVal: number | null = null;
      let segment: string | undefined = undefined;
      let occ: string | undefined = undefined;
      let accCount = 0;
      let loanCount = 0;
      let prodCount = 0;
      let casesCount = 0;
      let oppCount = 0;

      if (m.entityType === 'CUSTOMER') {
        const numId = Number(m.entityId);
        if (!isNaN(numId)) {
          isAuth = await this.canAccessCustomer(user, numId);
          const [c] = await db.select().from(customers).where(eq(customers.id, numId)).limit(1);

          if (c) {
            if (isAuth) {
              name = c.name;
              code = c.customerCode;
              cifNumber = c.cifNumber;
              relVal = c.relationshipValue ? Number(c.relationshipValue) : null;
              segment = c.entityType;
              occ = c.occupationOrSector;

              const [sc] = await db
                .select()
                .from(customerScores)
                .where(eq(customerScores.customerId, c.id))
                .limit(1);
              score = sc ? sc.coreScore : c.cibilScore || null;

              const [accs, lns, prods, cases, opps] = await Promise.all([
                db.select({ count: accounts.id }).from(accounts).where(eq(accounts.customerId, c.id)),
                db.select({ count: loans.id }).from(loans).where(eq(loans.customerId, c.id)),
                db.select({ count: customerProducts.id }).from(customerProducts).where(eq(customerProducts.customerId, c.id)),
                db.select({ count: serviceCases.id }).from(serviceCases).where(and(eq(serviceCases.customerId, c.id), eq(serviceCases.status, 'OPEN'))),
                db.select({ count: opportunities.id }).from(opportunities).where(and(eq(opportunities.customerId, c.id), eq(opportunities.stage, 'OPEN'))),
              ]);

              accCount = accs.length;
              loanCount = lns.length;
              prodCount = prods.length;
              casesCount = cases.length;
              oppCount = opps.length;
            } else {
              name = 'Protected Member (Restricted Access)';
              code = 'CUS-PROTECTED';
              cifNumber = undefined;
              relVal = null;
              score = null;
              segment = undefined;
              occ = undefined;
            }
          }
        }
      } else if (m.entityType === 'BUSINESS') {
        name = m.role ? `${m.role} (${m.entityId})` : m.entityId;
      }

      result.push({
        id: m.id,
        groupId: m.groupId,
        entityType: m.entityType as any,
        entityId: m.entityId,
        role: m.role,
        relationshipType: m.relationshipType as any,
        ownershipPercentage: m.ownershipPercentage ? Number(m.ownershipPercentage) : null,
        isPrimary: m.isPrimary,
        validFrom: m.validFrom ? String(m.validFrom) : null,
        validTo: m.validTo ? String(m.validTo) : null,
        name,
        code,
        cifNumber,
        isAuthorized: isAuth,
        coreScore: score,
        relationshipValue: relVal,
        formattedRelationshipValue: relVal !== null ? `₹${(relVal / 100000).toFixed(1)}L` : 'Unavailable',
        segment,
        occupationOrSector: occ,
        accountsCount: accCount,
        loansCount: loanCount,
        productsCount: prodCount,
        openCasesCount: casesCount,
        openOpportunitiesCount: oppCount,
      });
    }

    return result;
  },

  /**
   * Builds the multidimensional group profile adhering strictly to authorized member aggregation
   */
  async getGroupProfile(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ): Promise<GroupProfileDTO> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_PROFILE_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedMembers = members.filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER');
    const authorizedCustomerIds = authorizedMembers
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    // 1. Group Relationship Value
    let sumValue = 0;
    let hasValidValues = false;
    const valueBreakdown: any[] = [];

    for (const m of members) {
      if (m.isAuthorized && m.relationshipValue !== null && m.relationshipValue !== undefined) {
        sumValue += m.relationshipValue;
        hasValidValues = true;
        valueBreakdown.push({
          memberId: m.entityId,
          memberName: m.name,
          role: m.role,
          value: m.relationshipValue,
          formattedValue: `₹${(m.relationshipValue / 100000).toFixed(1)}L`,
          isAuthorized: true,
        });
      } else {
        valueBreakdown.push({
          memberId: m.entityId,
          memberName: m.name,
          role: m.role,
          value: null,
          formattedValue: 'Unavailable',
          isAuthorized: m.isAuthorized,
        });
      }
    }

    const relationshipValue = {
      totalValue: hasValidValues ? sumValue : null,
      formattedValue: hasValidValues ? `₹${(sumValue / 100000).toFixed(1)}L` : 'Unavailable',
      isAvailable: hasValidValues,
      authorizedMemberCount: authorizedMembers.length,
      totalMemberCount: members.length,
      hasRestrictedMembers: members.some((m) => !m.isAuthorized),
      breakdown: valueBreakdown,
    };

    // 2. Group Core Profile (Distributions and range, NEVER inventing a single group score)
    const validScores = authorizedMembers
      .map((m) => m.coreScore)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));

    let coreProfile = {
      averageScore: null as number | null,
      minScore: null as number | null,
      maxScore: null as number | null,
      scoreRange: 'N/A',
      distribution: {
        excellent: 0,
        good: 0,
        moderate: 0,
        needsAttention: 0,
      },
      summary: 'No authorized CORE scores available for group members.',
    };

    if (validScores.length > 0) {
      const min = Math.min(...validScores);
      const max = Math.max(...validScores);
      const avg = Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10;

      const dist = {
        excellent: validScores.filter((s) => s >= 80).length,
        good: validScores.filter((s) => s >= 70 && s < 80).length,
        moderate: validScores.filter((s) => s >= 50 && s < 70).length,
        needsAttention: validScores.filter((s) => s < 50).length,
      };

      coreProfile = {
        averageScore: avg,
        minScore: min,
        maxScore: max,
        scoreRange: min === max ? `${min}` : `${min} – ${max}`,
        distribution: dist,
        summary: `Score range: ${min} to ${max} across ${validScores.length} members (Group average: ${avg}). Individual customer scores maintained.`,
      };
    }

    // 3. Product Depth (Deduplicate shared product relationships)
    let productDepth = {
      uniqueProductsCount: 0,
      totalProductRelationships: 0,
      categories: [] as Array<{ category: string; count: number }>,
      uniqueProducts: [] as Array<{
        productId: number;
        productName: string;
        productCategory: string;
        assignedMembers: Array<{ id: string; name: string }>;
      }>,
    };

    if (authorizedCustomerIds.length > 0) {
      const custProds = await db
        .select({
          productId: customerProducts.productId,
          customerId: customerProducts.customerId,
          name: products.name,
          category: products.category,
        })
        .from(customerProducts)
        .innerJoin(products, eq(customerProducts.productId, products.id))
        .where(inArray(customerProducts.customerId, authorizedCustomerIds));

      const uniqueProdMap = new Map<number, { id: number; name: string; category: string; members: Map<string, string> }>();
      const catCountMap = new Map<string, number>();

      for (const cp of custProds) {
        if (!uniqueProdMap.has(cp.productId)) {
          uniqueProdMap.set(cp.productId, {
            id: cp.productId,
            name: cp.name,
            category: cp.category,
            members: new Map(),
          });
        }
        const memberObj = authorizedMembers.find((m) => m.entityId === String(cp.customerId));
        if (memberObj) {
          uniqueProdMap.get(cp.productId)!.members.set(memberObj.entityId, memberObj.name);
        }
        catCountMap.set(cp.category, (catCountMap.get(cp.category) || 0) + 1);
      }

      productDepth = {
        uniqueProductsCount: uniqueProdMap.size,
        totalProductRelationships: custProds.length,
        categories: Array.from(catCountMap.entries()).map(([category, count]) => ({ category, count })),
        uniqueProducts: Array.from(uniqueProdMap.values()).map((p) => ({
          productId: p.id,
          productName: p.name,
          productCategory: p.category,
          assignedMembers: Array.from(p.members.entries()).map(([id, name]) => ({ id, name })),
        })),
      };
    }

    // 4. Service Health
    let serviceHealth = {
      openCases: 0,
      criticalCases: 0,
      atRiskCases: 0,
      breachedCases: 0,
      resolvedRecently: 0,
      cases: [] as any[],
    };

    if (authorizedCustomerIds.length > 0) {
      const cases = await db
        .select()
        .from(serviceCases)
        .where(inArray(serviceCases.customerId, authorizedCustomerIds))
        .orderBy(desc(serviceCases.createdAt));

      const now = new Date();
      const openCasesList = cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS');
      const resolvedList = cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

      serviceHealth = {
        openCases: openCasesList.length,
        criticalCases: openCasesList.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length,
        atRiskCases: openCasesList.filter((c) => {
          if (!c.slaDueDate) return false;
          const diff = new Date(c.slaDueDate).getTime() - now.getTime();
          return diff > 0 && diff <= 24 * 60 * 60 * 1000;
        }).length,
        breachedCases: openCasesList.filter((c) => {
          if (!c.slaDueDate) return false;
          return new Date(c.slaDueDate).getTime() < now.getTime();
        }).length,
        resolvedRecently: resolvedList.length,
        cases: cases.map((c) => {
          const m = authorizedMembers.find((x) => x.entityId === String(c.customerId));
          const isBreached = c.slaDueDate ? new Date(c.slaDueDate).getTime() < now.getTime() : false;
          return {
            id: c.id,
            caseNumber: c.caseNumber,
            title: c.title,
            priority: c.priority,
            status: c.status,
            customerId: c.customerId,
            customerName: m ? m.name : `Customer #${c.customerId}`,
            slaDueDate: c.slaDueDate ? c.slaDueDate.toISOString() : null,
            isBreached,
          };
        }),
      };
    }

    // 5. Opportunities
    let opportunitiesProfile = {
      openCount: 0,
      pipelineValue: 0,
      formattedPipelineValue: '₹0.0L',
      stalledCount: 0,
      recentlyUpdatedCount: 0,
      byMember: [] as Array<{ memberId: string; memberName: string; count: number; value: number }>,
      opportunities: [] as any[],
    };

    if (authorizedCustomerIds.length > 0) {
      const opps = await db
        .select()
        .from(opportunities)
        .where(inArray(opportunities.customerId, authorizedCustomerIds))
        .orderBy(desc(opportunities.createdAt));

      const openOpps = opps.filter((o) => o.stage !== 'WON' && o.stage !== 'LOST');
      const pipeSum = openOpps.reduce((acc, cur) => acc + (cur.expectedValue ? Number(cur.expectedValue) : 0), 0);

      const byMemMap = new Map<string, { memberId: string; memberName: string; count: number; value: number }>();
      for (const o of openOpps) {
        const m = authorizedMembers.find((x) => x.entityId === String(o.customerId));
        const memName = m ? m.name : `Customer #${o.customerId}`;
        const key = String(o.customerId);
        if (!byMemMap.has(key)) {
          byMemMap.set(key, { memberId: key, memberName: memName, count: 0, value: 0 });
        }
        const entry = byMemMap.get(key)!;
        entry.count++;
        entry.value += o.expectedValue ? Number(o.expectedValue) : 0;
      }

      opportunitiesProfile = {
        openCount: openOpps.length,
        pipelineValue: pipeSum,
        formattedPipelineValue: `₹${(pipeSum / 100000).toFixed(1)}L`,
        stalledCount: openOpps.filter((o) => o.stage === 'PROPOSAL' || o.stage === 'QUALIFICATION').length,
        recentlyUpdatedCount: openOpps.length,
        byMember: Array.from(byMemMap.values()),
        opportunities: opps.map((o) => {
          const m = authorizedMembers.find((x) => x.entityId === String(o.customerId));
          return {
            id: o.id,
            title: o.title,
            stage: o.stage,
            estimatedValue: o.expectedValue ? Number(o.expectedValue) : null,
            customerId: o.customerId,
            customerName: m ? m.name : `Customer #${o.customerId}`,
            probability: o.probability ? Number(o.probability) : null,
            expectedCloseDate: o.expectedCloseDate ? String(o.expectedCloseDate) : null,
          };
        }),
      };
    }

    // 6. Active Journeys (Phase 33 Integration)
    let activeJourneys = {
      totalCount: 0,
      activeCount: 0,
      blockedCount: 0,
      atRiskCount: 0,
      completedCount: 0,
      journeys: [] as any[],
    };

    if (authorizedCustomerIds.length > 0) {
      const allJourneys: any[] = [];
      for (const cid of authorizedCustomerIds) {
        const jList = await journeyService.listJourneys({ customerId: cid }, user, requestId);
        allJourneys.push(...jList);
      }

      const activeList = allJourneys.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'ACTIVE');
      const blockedList = allJourneys.filter((j) => j.status === 'BLOCKED');
      const atRiskList = allJourneys.filter((j) => j.slaStatus === 'AT_RISK');
      const completedList = allJourneys.filter((j) => j.status === 'COMPLETED');

      activeJourneys = {
        totalCount: allJourneys.length,
        activeCount: activeList.length,
        blockedCount: blockedList.length,
        atRiskCount: atRiskList.length,
        completedCount: completedList.length,
        journeys: allJourneys.map((j) => ({
          id: j.id,
          journeyId: j.journeyId || j.journeyCode,
          name: j.name,
          journeyType: j.journeyType,
          status: j.status,
          slaStatus: j.slaStatus,
          customerId: j.customerId,
          customerName: j.customerName,
          blockedReason: j.blockedReason,
          progressPercentage: j.progress?.percentage || j.progress?.progressPercentage || 0,
        })),
      };
    }

    // 7. Signals (Radar)
    let signalsProfile = {
      totalActiveSignals: 0,
      criticalCount: 0,
      signals: [] as any[],
    };

    if (authorizedCustomerIds.length > 0) {
      const signals = await db
        .select()
        .from(customerOpportunityRadar)
        .where(
          and(
            inArray(customerOpportunityRadar.customerId, authorizedCustomerIds),
            eq(customerOpportunityRadar.status, 'ACTIVE')
          )
        )
        .orderBy(desc(customerOpportunityRadar.detectedAt));

      signalsProfile = {
        totalActiveSignals: signals.length,
        criticalCount: signals.filter((s) => s.priority === 'CRITICAL' || s.priority === 'HIGH').length,
        signals: signals.map((s) => {
          const m = authorizedMembers.find((x) => x.entityId === String(s.customerId));
          return {
            id: s.id,
            customerId: s.customerId,
            customerName: m ? m.name : `Customer #${s.customerId}`,
            signalType: s.signalType,
            title: s.title,
            description: s.summary,
            severity: s.priority,
            detectedAt: s.detectedAt.toISOString(),
          };
        }),
      };
    }

    // 8. Engagement
    let engagement = {
      totalInteractionsLast90Days: 0,
      lastInteractionDate: null as string | null,
    };

    if (authorizedCustomerIds.length > 0) {
      const inters = await db
        .select()
        .from(interactions)
        .where(inArray(interactions.customerId, authorizedCustomerIds))
        .orderBy(desc(interactions.timestamp))
        .limit(10);

      engagement = {
        totalInteractionsLast90Days: inters.length,
        lastInteractionDate: inters[0]?.timestamp ? inters[0].timestamp.toISOString() : null,
      };
    }

    return {
      groupId: group.groupId,
      groupName: group.name,
      groupType: group.groupType as GroupType,
      relationshipValue,
      coreProfile,
      productDepth,
      serviceHealth,
      opportunities: opportunitiesProfile,
      activeJourneys,
      signals: signalsProfile,
      engagement,
    };
  },

  /**
   * Retrieves unified chronological interaction timeline across authorized group members
   */
  async getGroupTimeline(
    idOrGroupId: number | string,
    limit: number = 50,
    user: SafeUser,
    requestId: string
  ): Promise<GroupTimelineEventDTO[]> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_TIMELINE_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    const events: GroupTimelineEventDTO[] = [];

    if (authorizedCustomerIds.length > 0) {
      // 1. Interactions
      const inters = await db
        .select()
        .from(interactions)
        .where(inArray(interactions.customerId, authorizedCustomerIds))
        .orderBy(desc(interactions.timestamp))
        .limit(limit);

      for (const i of inters) {
        const m = members.find((x) => x.entityId === String(i.customerId));
        events.push({
          id: `INTERACTION-${i.id}`,
          timestamp: i.timestamp.toISOString(),
          entity: m ? m.name : `Customer #${i.customerId}`,
          entityId: String(i.customerId),
          interactionType: i.interactionType,
          title: i.subject || i.interactionType,
          description: i.summary || 'Standard relationship interaction logged.',
          owner: 'Relationship Manager',
          source: 'CRM Interactions',
        });
      }

      // 2. Service Cases
      const cases = await db
        .select()
        .from(serviceCases)
        .where(inArray(serviceCases.customerId, authorizedCustomerIds))
        .orderBy(desc(serviceCases.createdAt))
        .limit(20);

      for (const c of cases) {
        const m = members.find((x) => x.entityId === String(c.customerId));
        events.push({
          id: `CASE-${c.id}`,
          timestamp: c.createdAt.toISOString(),
          entity: m ? m.name : `Customer #${c.customerId}`,
          entityId: String(c.customerId),
          interactionType: 'SERVICE_CASE',
          title: `Service Case #${c.caseNumber}: ${c.title}`,
          description: `Priority: ${c.priority}, Status: ${c.status}`,
          owner: 'Service Desk',
          source: 'Service Management',
        });
      }

      // 3. Journeys
      for (const cid of authorizedCustomerIds) {
        const jList = await journeyService.listJourneys({ customerId: cid }, user, requestId);
        for (const j of jList.slice(0, 5)) {
          if (j.startedAt) {
            events.push({
              id: `JOURNEY-${j.id}`,
              timestamp: j.startedAt,
              entity: j.customerName || `Customer #${cid}`,
              entityId: String(cid),
              interactionType: 'JOURNEY',
              title: `Customer Journey Initiated: ${j.name}`,
              description: `Lifecycle Template: ${j.journeyType}, Status: ${j.status}`,
              owner: j.ownerName || 'Journey System',
              source: 'Journey Orchestrator',
            });
          }
        }
      }
    }

    // Sort chronologically descending
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Retrieves group evidence connecting members and corporate affiliations
   */
  async getGroupEvidence(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_EVIDENCE_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => m.entityId);

    // Retrieve relationship edges from Phase 28
    const edges = await db
      .select()
      .from(relationshipEdges)
      .where(
        or(
          eq(relationshipEdges.targetEntityId, group.groupId),
          and(
            inArray(relationshipEdges.sourceEntityId, authorizedCustomerIds),
            eq(relationshipEdges.status, 'ACTIVE')
          )
        )
      );

    return {
      groupId: group.groupId,
      groupName: group.name,
      groupType: group.groupType,
      evidenceRecords: edges.map((e) => ({
        id: e.id,
        source: `${e.sourceEntityType}:${e.sourceEntityId}`,
        target: `${e.targetEntityType}:${e.targetEntityId}`,
        relationshipType: e.relationshipType,
        provenanceType: e.provenanceType,
        provenanceId: e.provenanceId,
        visibilityScope: e.visibilityScope,
        verifiedAt: e.createdAt.toISOString(),
      })),
    };
  },

  /**
   * Retrieves active relationship edges for group and authorized members
   */
  async getGroupRelationships(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) throw new BankingError('GROUP_NOT_FOUND', `Group '${idOrGroupId}' not found.`, 404);
    await this.authorizeGroup(user, group, 'GROUP_RELATIONSHIPS_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => m.entityId);

    return await db.select().from(relationshipEdges).where(
      or(
        eq(relationshipEdges.targetEntityId, group.groupId),
        eq(relationshipEdges.sourceEntityId, group.groupId),
        authorizedCustomerIds.length > 0 ? inArray(relationshipEdges.sourceEntityId, authorizedCustomerIds) : sql`false`
      )
    );
  },

  /**
   * Retrieves lifecycle journeys across authorized group members
   */
  async getGroupJourneys(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) throw new BankingError('GROUP_NOT_FOUND', `Group '${idOrGroupId}' not found.`, 404);
    await this.authorizeGroup(user, group, 'GROUP_JOURNEYS_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    const allJourneys: any[] = [];
    for (const cid of authorizedCustomerIds) {
      const list = await journeyService.listJourneys({ customerId: cid }, user, requestId);
      allJourneys.push(...list);
    }
    return allJourneys;
  },

  /**
   * Retrieves opportunities across authorized group members
   */
  async getGroupOpportunities(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) throw new BankingError('GROUP_NOT_FOUND', `Group '${idOrGroupId}' not found.`, 404);
    await this.authorizeGroup(user, group, 'GROUP_OPPORTUNITIES_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    if (authorizedCustomerIds.length === 0) return [];
    return await db
      .select()
      .from(opportunities)
      .where(inArray(opportunities.customerId, authorizedCustomerIds))
      .orderBy(desc(opportunities.createdAt));
  },

  /**
   * Retrieves service desk cases across authorized group members
   */
  async getGroupServiceCases(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) throw new BankingError('GROUP_NOT_FOUND', `Group '${idOrGroupId}' not found.`, 404);
    await this.authorizeGroup(user, group, 'GROUP_SERVICE_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    if (authorizedCustomerIds.length === 0) return [];
    return await db
      .select()
      .from(serviceCases)
      .where(inArray(serviceCases.customerId, authorizedCustomerIds))
      .orderBy(desc(serviceCases.createdAt));
  },

  /**
   * Retrieves signals across authorized group members
   */
  async getGroupSignals(
    idOrGroupId: number | string,
    user: SafeUser,
    requestId: string
  ) {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) throw new BankingError('GROUP_NOT_FOUND', `Group '${idOrGroupId}' not found.`, 404);
    await this.authorizeGroup(user, group, 'GROUP_SIGNALS_READ', requestId);

    const members = await this.getGroupMembers(group.id, user, requestId);
    const authorizedCustomerIds = members
      .filter((m) => m.isAuthorized && m.entityType === 'CUSTOMER')
      .map((m) => Number(m.entityId))
      .filter((id) => !isNaN(id));

    if (authorizedCustomerIds.length === 0) return [];
    return await db
      .select()
      .from(customerOpportunityRadar)
      .where(
        and(
          inArray(customerOpportunityRadar.customerId, authorizedCustomerIds),
          ne(customerOpportunityRadar.status, 'DISMISSED'),
          ne(customerOpportunityRadar.status, 'CONVERTED')
        )
      )
      .orderBy(desc(customerOpportunityRadar.detectedAt));
  },

  /**
   * Alias for portfolio analytics
   */
  async getGroupAnalytics(user: SafeUser, requestId: string): Promise<GroupAnalyticsDTO> {
    return await this.getPortfolioAnalytics(user, requestId);
  },

  /**
   * Creates a new relationship group
   */
  async createGroup(
    payload: CreateGroupPayload,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipGroupDTO> {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    if (
      user.role !== 'ADMINISTRATOR' &&
      user.role !== 'BRANCH_MANAGER' &&
      user.role !== 'RELATIONSHIP_MANAGER' &&
      !user.permissions.includes('groups:write') &&
      !user.permissions.includes('admin:all')
    ) {
      throw new BankingError(
        'FORBIDDEN',
        `Role '${user.role}' is not authorized to create relationship groups.`,
        403
      );
    }

    if (!payload.name || !payload.name.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Group name is required.', 400);
    }

    const groupType: GroupType = payload.groupType || 'HOUSEHOLD';
    const prefix = groupType === 'HOUSEHOLD' ? 'HH' : 'BIZ';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedGroupId = payload.groupId || `${prefix}-${randomSuffix}`;

    // Verify groupId uniqueness
    const existing = await groupRepository.getGroupByGroupId(generatedGroupId);
    if (existing) {
      throw new BankingError('DUPLICATE_GROUP', `Group with ID '${generatedGroupId}' already exists.`, 400);
    }

    const inserted = await groupRepository.createGroup({
      groupId: generatedGroupId,
      groupType,
      name: payload.name.trim(),
      displayName: payload.displayName?.trim() || payload.name.trim(),
      description: payload.description?.trim() || null,
      status: 'ACTIVE',
      primaryCustomerId: payload.primaryCustomerId || null,
      primaryBusinessId: payload.primaryBusinessId || null,
      relationshipManagerId: payload.relationshipManagerId || user.id,
      metadata: payload.metadata || {},
    });

    // Add initial members if provided
    if (payload.members && Array.isArray(payload.members)) {
      for (const m of payload.members) {
        await groupRepository.addGroupMember({
          groupId: inserted.id,
          entityType: m.entityType,
          entityId: m.entityId,
          role: m.role,
          relationshipType: m.relationshipType,
          ownershipPercentage: m.ownershipPercentage,
          isPrimary: m.isPrimary ?? false,
          validFrom: m.validFrom,
          validTo: m.validTo,
        });
      }
    } else if (payload.primaryCustomerId) {
      // Automatically add primary customer as primary member
      await groupRepository.addGroupMember({
        groupId: inserted.id,
        entityType: 'CUSTOMER',
        entityId: String(payload.primaryCustomerId),
        role: groupType === 'HOUSEHOLD' ? 'Head of Family' : 'Managing Director',
        relationshipType: groupType === 'HOUSEHOLD' ? 'HEAD_OF_FAMILY' : 'DIRECTOR',
        isPrimary: true,
      });
    }

    // Audit log
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'GROUP_CREATED',
      resourceType: 'RELATIONSHIP_GROUP',
      resourceId: inserted.groupId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { groupType, name: inserted.name },
    });

    return await this.getGroup(inserted.id, user, requestId);
  },

  /**
   * Updates an existing relationship group
   */
  async updateGroup(
    idOrGroupId: number | string,
    payload: UpdateGroupPayload,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipGroupDTO> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_UPDATE', requestId);

    const updateData: any = {};
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.displayName) updateData.displayName = payload.displayName.trim();
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.status) updateData.status = payload.status;
    if (payload.primaryCustomerId !== undefined) updateData.primaryCustomerId = payload.primaryCustomerId;
    if (payload.primaryBusinessId !== undefined) updateData.primaryBusinessId = payload.primaryBusinessId;
    if (payload.relationshipManagerId !== undefined) updateData.relationshipManagerId = payload.relationshipManagerId;
    if (payload.metadata) updateData.metadata = payload.metadata;

    await groupRepository.updateGroup(group.id, updateData);

    return await this.getGroup(group.id, user, requestId);
  },

  /**
   * Adds a member to an existing relationship group
   */
  async addGroupMember(
    idOrGroupId: number | string,
    payload: AddGroupMemberPayload,
    user: SafeUser,
    requestId: string
  ): Promise<GroupMemberDTO[]> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_MEMBER_ADD', requestId);

    const VALID_RELATIONSHIP_TYPES: GroupRelationshipType[] = [
      'HOUSEHOLD_MEMBER',
      'HEAD_OF_FAMILY',
      'SPOUSE',
      'DEPENDENT',
      'PARENT',
      'CHILD',
      'OWNER',
      'DIRECTOR',
      'SHAREHOLDER',
      'PARTNER',
      'AUTHORIZED_SIGNATORY',
      'BENEFICIAL_OWNER',
      'KEY_PERSON',
      'RELATED_BUSINESS',
      'OTHER',
    ];

    if (!payload.relationshipType || !VALID_RELATIONSHIP_TYPES.includes(payload.relationshipType as any)) {
      throw new BankingError(
        'VALIDATION_ERROR',
        `Invalid relationshipType '${payload.relationshipType}'. Supported types: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
        400
      );
    }

    if (payload.entityType === 'CUSTOMER') {
      const numId = Number(payload.entityId);
      if (isNaN(numId)) {
        throw new BankingError('VALIDATION_ERROR', 'Customer entityId must be a valid customer ID.', 400);
      }
      const [c] = await db.select().from(customers).where(eq(customers.id, numId)).limit(1);
      if (!c) {
        throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${payload.entityId} does not exist.`, 404);
      }
    }

    await groupRepository.addGroupMember({
      groupId: group.id,
      entityType: payload.entityType,
      entityId: payload.entityId,
      role: payload.role,
      relationshipType: payload.relationshipType,
      ownershipPercentage: payload.ownershipPercentage,
      isPrimary: payload.isPrimary ?? false,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      metadata: payload.metadata || {},
    });

    return await this.getGroupMembers(group.id, user, requestId);
  },

  /**
   * Removes a member from a relationship group
   */
  async removeGroupMember(
    idOrGroupId: number | string,
    memberId: number,
    user: SafeUser,
    requestId: string
  ): Promise<GroupMemberDTO[]> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_MEMBER_REMOVE', requestId);

    await groupRepository.removeGroupMember(memberId);

    return await this.getGroupMembers(group.id, user, requestId);
  },

  /**
   * Controlled ownership handoff of a group
   */
  async handoffGroup(
    idOrGroupId: number | string,
    payload: HandoffGroupPayload,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipGroupDTO> {
    const group = await this.resolveGroup(idOrGroupId);
    if (!group) {
      throw new BankingError('GROUP_NOT_FOUND', `Relationship group '${idOrGroupId}' not found.`, 404);
    }

    await this.authorizeGroup(user, group, 'GROUP_HANDOFF', requestId);

    const [newOwner] = await db.select().from(users).where(eq(users.id, payload.targetUserId)).limit(1);
    if (!newOwner) {
      throw new BankingError('USER_NOT_FOUND', `Target relationship manager #${payload.targetUserId} not found.`, 404);
    }

    const previousOwnerId = group.relationshipManagerId;
    await groupRepository.updateGroup(group.id, {
      relationshipManagerId: newOwner.id,
    });

    // Notify new owner
    await notificationService.createNotification({
      userId: newOwner.id,
      customerId: group.primaryCustomerId || 1,
      notificationType: 'JOURNEY_STEP_ASSIGNED',
      category: 'CUSTOMER',
      severity: 'INFO',
      title: `Group Assigned: ${group.name}`,
      message: `Ownership of group ${group.groupId} has been transferred to you. Reason: ${payload.reason}`,
      sourceEntityType: 'RELATIONSHIP_GROUP',
      sourceEntityId: group.groupId,
    });

    // Audit log
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'GROUP_OWNER_CHANGED',
      resourceType: 'RELATIONSHIP_GROUP',
      resourceId: group.groupId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        previousOwnerId,
        newOwnerId: newOwner.id,
        reason: payload.reason,
      },
    });

    return await this.getGroup(group.id, user, requestId);
  },

  /**
   * Aggregates portfolio analytics across relationship groups
   */
  async getPortfolioAnalytics(user: SafeUser, requestId: string): Promise<GroupAnalyticsDTO> {
    let allowedGroupIds: number[] | undefined = undefined;

    if (user.role === 'RELATIONSHIP_MANAGER') {
      const allGroups = await db.query.relationshipGroups.findMany({
        with: { members: true },
      });
      const authorizedIds: number[] = [];
      for (const g of allGroups) {
        try {
          await this.authorizeGroup(user, g, 'GROUP_ANALYTICS', requestId);
          authorizedIds.push(g.id);
        } catch {
          // not authorized
        }
      }
      allowedGroupIds = authorizedIds;
    }

    const analytics = await groupRepository.getPortfolioAnalytics(allowedGroupIds);

    // Compute total relationship value across groups
    const groups = await groupRepository.getGroups({ limit: 10000 }, allowedGroupIds);
    let totalVal = 0;
    const topGroups: any[] = [];

    for (const g of groups) {
      const members = await this.getGroupMembers(g.id, user, requestId);
      const groupVal = members
        .filter((m) => m.isAuthorized && m.relationshipValue !== null && m.relationshipValue !== undefined)
        .reduce((sum, cur) => sum + (cur.relationshipValue || 0), 0);

      totalVal += groupVal;
      topGroups.push({
        id: g.id,
        groupId: g.groupId,
        name: g.name,
        type: g.groupType,
        value: groupVal,
      });
    }

    analytics.totalGroupRelationshipValue = totalVal;
    analytics.formattedTotalValue = `₹${(totalVal / 100000).toFixed(1)}L`;
    analytics.topGroupsByValue = topGroups.sort((a, b) => b.value - a.value).slice(0, 5);

    // Audit log
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'GROUP_PROFILE_VIEWED',
      resourceType: 'PORTFOLIO_GROUPS',
      resourceId: 'ALL',
      requestId,
      outcome: 'SUCCESS',
    });

    return analytics;
  },
};
