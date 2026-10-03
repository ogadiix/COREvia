/**
 * COREvia Phase 38: Adapter Registry
 * Maps integration IDs to adapter singleton instances.
 */

import { IntegrationAdapter } from './types.ts';
import { CoreBankingSimulatorAdapter } from './CoreBankingSimulatorAdapter.ts';
import { KycSimulatorAdapter } from './KycSimulatorAdapter.ts';
import { DocumentSimulatorAdapter } from './DocumentSimulatorAdapter.ts';
import { PaymentsSimulatorAdapter } from './PaymentsSimulatorAdapter.ts';
import { NotificationSimulatorAdapter } from './NotificationSimulatorAdapter.ts';

export * from './types.ts';
export * from './CoreBankingSimulatorAdapter.ts';
export * from './KycSimulatorAdapter.ts';
export * from './DocumentSimulatorAdapter.ts';
export * from './PaymentsSimulatorAdapter.ts';
export * from './NotificationSimulatorAdapter.ts';

class AdapterRegistry {
  private adapters = new Map<string, IntegrationAdapter>();

  constructor() {
    this.register(new CoreBankingSimulatorAdapter());
    this.register(new KycSimulatorAdapter());
    this.register(new DocumentSimulatorAdapter());
    this.register(new PaymentsSimulatorAdapter());
    this.register(new NotificationSimulatorAdapter());
  }

  register(adapter: IntegrationAdapter) {
    this.adapters.set(adapter.integrationId, adapter);
  }

  get(integrationId: string): IntegrationAdapter | undefined {
    return this.adapters.get(integrationId);
  }

  list(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const adapterRegistry = new AdapterRegistry();
