/**
 * COREvia Phase 34: Household & Business Group 360 API Routes
 * Exposes governed endpoints for groups, members, profiles, timelines,
 * relationships, journeys, opportunities, service desk, signals, and evidence.
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { groupService } from '../services/group.service.ts';
import { BankingError } from '../lib/errors.ts';
import { GroupType, GroupStatus } from '../types/group.types.ts';

export const groupRouter = Router();

/**
 * GET /api/groups/analytics
 * Descriptive portfolio group analytics with RBAC filtering
 */
groupRouter.get('/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const analytics = await groupService.getGroupAnalytics(user, req.requestId!);
    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups
 * List relationship groups with filters
 */
groupRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const groupType = req.query.groupType as GroupType | undefined;
    const status = req.query.status as GroupStatus | undefined;
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const groups = await groupService.listGroups(
      { groupType, status, relationshipManagerId: ownerId, search, limit, offset },
      user,
      req.requestId!
    );

    return res.json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/groups
 * Create a new relationship group
 */
groupRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      groupId,
      groupType,
      name,
      displayName,
      description,
      primaryCustomerId,
      primaryBusinessId,
      relationshipManagerId,
      secondaryRmId,
      metadata,
    } = req.body;

    if (!groupId || !groupType || !name || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: groupId, groupType, name, displayName',
      });
    }

    const group = await groupService.createGroup(
      {
        groupId,
        groupType,
        name,
        displayName,
        description,
        primaryCustomerId,
        primaryBusinessId,
        relationshipManagerId,
        metadata,
      },
      user,
      req.requestId!
    );

    return res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id
 * Retrieve group by id or groupId
 */
groupRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const group = await groupService.getGroup(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PUT /api/groups/:id
 * Update group metadata or status
 */
groupRouter.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const group = await groupService.updateGroup(req.params.id, req.body, user, req.requestId!);
    return res.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/groups/:id/handoff
 * Reassign relationship manager ownership
 */
groupRouter.post('/:id/handoff', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { newOwnerId, reason } = req.body;
    if (!newOwnerId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: newOwnerId, reason',
      });
    }

    const group = await groupService.handoffGroup(
      req.params.id,
      { targetUserId: Number(newOwnerId), reason },
      user,
      req.requestId!
    );

    return res.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/members
 * Retrieve group members with strict member-level RBAC filtering
 */
groupRouter.get('/:id/members', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const members = await groupService.getGroupMembers(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/groups/:id/members
 * Add member to relationship group
 */
groupRouter.post('/:id/members', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { entityType, entityId, role, relationshipType, ownershipPercentage, isPrimary, metadata } = req.body;

    if (!entityType || !entityId || !role || !relationshipType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityType, entityId, role, relationshipType',
      });
    }

    const member = await groupService.addGroupMember(
      req.params.id,
      { entityType, entityId, role, relationshipType, ownershipPercentage, isPrimary, metadata },
      user,
      req.requestId!
    );

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/groups/:id/members/:memberId
 * Remove member from group
 */
groupRouter.delete('/:id/members/:memberId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = await groupService.removeGroupMember(
      req.params.id,
      Number(req.params.memberId),
      user,
      req.requestId!
    );
    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/profile
 * Multidimensional group relationship profile
 */
groupRouter.get('/:id/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const profile = await groupService.getGroupProfile(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/timeline
 * Unified interaction timeline across group entities
 */
groupRouter.get('/:id/timeline', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const timeline = await groupService.getGroupTimeline(req.params.id, limit, user, req.requestId!);
    return res.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/relationships
 * Existing Relationship Graph edges for this group and its members
 */
groupRouter.get('/:id/relationships', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const relationships = await groupService.getGroupRelationships(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: relationships,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/journeys
 * Active customer lifecycle journeys across authorized group members
 */
groupRouter.get('/:id/journeys', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const journeys = await groupService.getGroupJourneys(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: journeys,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/opportunities
 * CRM opportunities across authorized members
 */
groupRouter.get('/:id/opportunities', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const opportunities = await groupService.getGroupOpportunities(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: opportunities,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/service
 * Service cases and SLAs across authorized members
 */
groupRouter.get('/:id/service', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const serviceCases = await groupService.getGroupServiceCases(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: serviceCases,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/signals
 * Signal Center alerts and warnings across authorized members
 */
groupRouter.get('/:id/signals', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const signals = await groupService.getGroupSignals(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: signals,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/evidence
 * Provenance traceability and source records for group connections
 */
groupRouter.get('/:id/evidence', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const evidence = await groupService.getGroupEvidence(req.params.id, user, req.requestId!);
    return res.json({
      success: true,
      data: evidence,
    });
  } catch (error: any) {
    if (error instanceof BankingError) {
      return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    }
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});
