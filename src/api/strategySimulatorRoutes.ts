import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { strategySimulatorService } from '../services/strategySimulator.service';
import { BankingError } from '../lib/errors';

export const strategySimulatorRouter = Router();
strategySimulatorRouter.use(requireAuth);

/**
 * GET /api/strategy-scenarios/analytics
 * Retrieve descriptive analytics across authorized scenarios
 */
strategySimulatorRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const analytics = await strategySimulatorService.getAnalytics(user);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * GET /api/strategy-scenarios/search
 * Search saved scenarios across portfolio
 */
strategySimulatorRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const q = String(req.query.q || '');
    if (!q.trim()) {
      res.json({ success: true, data: [] });
      return;
    }
    const results = await strategySimulatorService.searchScenarios(q, user);
    res.json({ success: true, data: results });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * GET /api/strategy-scenarios/customer/:customerId
 * List scenarios for a specific customer
 */
strategySimulatorRouter.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const customerId = Number(req.params.customerId);
    if (isNaN(customerId)) {
      res.status(400).json({ success: false, error: 'Invalid customer ID' });
      return;
    }
    const scenarios = await strategySimulatorService.listCustomerScenarios(customerId, user);
    res.json({ success: true, data: scenarios });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios/simulate-adhoc
 * Run ad-hoc simulation without persisting a scenario
 */
strategySimulatorRouter.post('/simulate-adhoc', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { customerId, actions, scenarioName, description } = req.body;

    if (!customerId || !Array.isArray(actions)) {
      res.status(400).json({ success: false, error: 'customerId and actions array are required' });
      return;
    }

    const result = await strategySimulatorService.simulateScenario(
      {
        customerId: Number(customerId),
        actions,
        scenarioName,
        description,
      },
      user
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios
 * Create and optionally simulate a new scenario
 */
strategySimulatorRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { customerId, name, description, actions, autoSimulate } = req.body;

    if (!customerId || !name) {
      res.status(400).json({ success: false, error: 'customerId and name are required' });
      return;
    }

    const scenario = await strategySimulatorService.createScenario(
      {
        customerId: Number(customerId),
        name,
        description,
        actions: actions || [],
      },
      user
    );

    if (autoSimulate && actions && actions.length > 0) {
      const simulated = await strategySimulatorService.simulateExistingScenario(scenario.id, user);
      res.status(201).json({ success: true, data: simulated });
      return;
    }

    res.status(201).json({ success: true, data: scenario });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * GET /api/strategy-scenarios/:id
 * Retrieve a scenario with freshness detection
 */
strategySimulatorRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const scenario = await strategySimulatorService.getScenario(req.params.id, user);
    res.json({ success: true, data: scenario });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios/:id/simulate
 * Run simulation on an existing scenario and update its stored result
 */
strategySimulatorRouter.post('/:id/simulate', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await strategySimulatorService.simulateExistingScenario(req.params.id, user);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios/:id/save
 * Save a simulated scenario
 */
strategySimulatorRouter.post('/:id/save', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const saved = await strategySimulatorService.saveScenario(req.params.id, user);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios/:id/archive
 * Archive a scenario
 */
strategySimulatorRouter.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const archived = await strategySimulatorService.archiveScenario(req.params.id, user);
    res.json({ success: true, data: archived });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * GET /api/strategy-scenarios/:id/compare/:otherId
 * Compare two scenarios side-by-side (same customer only)
 */
strategySimulatorRouter.get('/:id/compare/:otherId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const comparison = await strategySimulatorService.compareScenarios(
      req.params.id,
      req.params.otherId,
      user
    );
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    handleError(res, error);
  }
});

/**
 * POST /api/strategy-scenarios/:id/apply-action
 * Bridge to real operational execution with human confirmation
 */
strategySimulatorRouter.post('/:id/apply-action', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { actionIndex, confirmationNotes, customPayload } = req.body;

    if (actionIndex === undefined || actionIndex === null) {
      res.status(400).json({ success: false, error: 'actionIndex is required' });
      return;
    }

    const result = await strategySimulatorService.applyActualAction(
      {
        scenarioId: req.params.id,
        actionIndex: Number(actionIndex),
        confirmationNotes: String(confirmationNotes || ''),
        customPayload,
      },
      user
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error);
  }
});

function handleError(res: Response, error: any) {
  if (error instanceof BankingError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      error: error.message,
    });
    return;
  }
  console.error('Strategy Simulator API Error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error in strategy simulator',
  });
}
