import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { relationshipGraphService } from '../services/relationshipGraph.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';

export const relationshipGraphRouter = Router();

/**
 * GET /api/relationship-graph/analytics
 * Descriptive analytics for graph degree and entity distributions
 */
relationshipGraphRouter.get('/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const analytics = await relationshipGraphService.getGraphAnalytics(req.user!, customerId);
    res.json(analytics);
  } catch (err: any) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/relationship-graph/path/:sourceType/:sourceId/:targetType/:targetId
 * Shortest path exploration between two banking entities
 */
relationshipGraphRouter.get(
  '/path/:sourceType/:sourceId/:targetType/:targetId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { sourceType, sourceId, targetType, targetId } = req.params;
      const pathResult = await relationshipGraphService.findRelationshipPath(
        sourceType,
        sourceId,
        targetType,
        targetId,
        req.user!,
        req.requestId
      );
      res.json(pathResult);
    } catch (err: any) {
      const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
    }
  }
);

/**
 * GET /api/relationship-graph/neighbors/:entityType/:entityId
 * Fast lookup of immediate degree-1 neighbors
 */
relationshipGraphRouter.get(
  '/neighbors/:entityType/:entityId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const neighbors = await relationshipGraphService.getRelationshipNeighbors(
        entityType,
        entityId,
        req.user!,
        req.requestId
      );
      res.json(neighbors);
    } catch (err: any) {
      const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
    }
  }
);

/**
 * GET /api/relationship-graph/evidence/:edgeId
 * Detailed provenance and regulatory audit evidence for an edge
 */
relationshipGraphRouter.get(
  '/evidence/:edgeId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { edgeId } = req.params;
      const evidence = await relationshipGraphService.getRelationshipEvidence(
        edgeId,
        req.user!,
        req.requestId
      );
      res.json(evidence);
    } catch (err: any) {
      const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
    }
  }
);

/**
 * GET /api/relationship-graph/:entityType/:entityId
 * Core Relationship Graph retrieval endpoint with governed depth, filtering, and provenance
 */
relationshipGraphRouter.get(
  '/:entityType/:entityId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { entityType, entityId } = req.params;

      const depth = req.query.depth ? parseInt(String(req.query.depth), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 80;
      const includeSignals = req.query.includeSignals !== 'false';
      const includeOperationalContext = req.query.includeOperationalContext !== 'false';

      let nodeTypes: string[] | undefined;
      if (req.query.nodeTypes) {
        nodeTypes = String(req.query.nodeTypes)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      let relationshipTypes: string[] | undefined;
      if (req.query.relationshipTypes) {
        relationshipTypes = String(req.query.relationshipTypes)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const graph = await relationshipGraphService.getRelationshipGraph(
        entityType,
        entityId,
        req.user!,
        {
          depth,
          limit,
          includeSignals,
          includeOperationalContext,
          nodeTypes,
          relationshipTypes,
        },
        req.requestId
      );

      res.json(graph);
    } catch (err: any) {
      const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
    }
  }
);
