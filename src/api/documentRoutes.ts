import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { formatErrorResponse } from '../lib/errors.ts';
import { documentService } from '../services/document.service.ts';

export const documentRouter = Router();

/**
 * GET /api/documents
 * List documents with advanced filtering, sorting, and pagination
 */
documentRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const result = await documentService.listDocuments(
      {
        customerId: req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined,
        customerSearch: req.query.customerSearch as string | undefined,
        documentType: req.query.documentType as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        reviewStatus: req.query.reviewStatus as string | undefined,
        relatedEntityType: req.query.relatedEntityType as string | undefined,
        relatedEntityId: req.query.relatedEntityId as string | undefined,
        ownerId: req.query.ownerId ? parseInt(req.query.ownerId as string, 10) : undefined,
        search: req.query.search as string | undefined,
        subsection: req.query.subsection as any,
        expiryFilter: req.query.expiryFilter as any,
        sortBy: req.query.sortBy as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      },
      actorContext
    );

    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/documents/metrics
 * Overview metrics for dashboard widgets & status cards
 */
documentRouter.get('/metrics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
    const metrics = await documentService.getMetrics(customerId);
    res.json(metrics);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/documents/intelligence
 * Returns deterministic document signals (missing requirements, expired, awaiting review, etc.)
 */
documentRouter.get('/intelligence', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
    const signals = await documentService.getDocumentIntelligence(customerId);
    res.json(signals);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/documents/requirements
 * Returns customer requirements
 */
documentRouter.get('/requirements', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;
    if (!customerId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'customerId query parameter is required' },
      });
    }

    const data = await documentService.getCustomerRequirements(customerId);
    res.json(data);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/documents/:id
 * Retrieve single document details with version history, reviews, and extractions
 */
documentRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const doc = await documentService.getDocumentById(id, actorContext);
    res.json(doc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/documents/:id/download
 * Safe streaming of synthetic document contents
 */
documentRouter.get('/:id/download', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const file = await documentService.getDocumentFile(id, actorContext);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.contentBuffer);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents
 * Upload synthetic or provided customer document
 */
documentRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const doc = await documentService.uploadDocument(req.body, actorContext);
    res.status(201).json(doc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/:id/replace
 * Replace existing document with a new version
 */
documentRouter.post('/:id/replace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const updated = await documentService.replaceDocument(id, req.body, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/:id/verify
 * Reviewer verifies and approves document
 */
documentRouter.post('/:id/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const comments = req.body.comments || 'Verified in compliance with underwriting standards.';
    const updated = await documentService.verifyDocument(id, comments, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/:id/reject
 * Reviewer rejects document with mandatory reason
 */
documentRouter.post('/:id/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const updated = await documentService.rejectDocument(id, req.body, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/:id/request-replacement
 * Reviewer requests replacement with reason, requested doc type, and due date
 */
documentRouter.post('/:id/request-replacement', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const updated = await documentService.requestReplacement(id, req.body, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/:id/extract
 * Triggers extraction on document fields
 */
documentRouter.post('/:id/extract', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    await documentService.extractFields(id, actorContext);
    const updated = await documentService.getDocumentById(id, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/documents/extractions/:extractionId/verify
 * Human verification or rejection of an extracted field
 */
documentRouter.post('/extractions/:extractionId/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const extractionId = parseInt(req.params.extractionId, 10);
    const actorContext = {
      userId: req.user!.id,
      userName: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const status = req.body.status === 'REJECTED' ? 'REJECTED' : 'HUMAN_VERIFIED';
    await documentService.verifyExtractionField(extractionId, status, actorContext);
    res.json({ success: true, extractionId, status });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});
