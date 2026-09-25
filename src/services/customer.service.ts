import { customerRepository, CustomerFilterParams } from '../repositories/customer.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { BankingError } from '../lib/errors.ts';

export const customerService = {
  async listCustomers(params: CustomerFilterParams) {
    return await customerRepository.findMany(params);
  },

  async getCustomerById(idOrCode: string | number) {
    const customer = await customerRepository.findByIdOrCode(idOrCode);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${idOrCode}' could not be found.`, 404);
    }
    return customer;
  },

  async getCustomer360(idOrCode: string | number, actorContext?: { actorId: string; actorName: string; requestId: string }) {
    const customer = await customerRepository.findByIdOrCode(idOrCode);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${idOrCode}' could not be found.`, 404);
    }

    const data360 = await customerRepository.getCustomer360(customer.id);
    if (!data360) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer 360 details unavailable for '${idOrCode}'.`, 404);
    }

    if (actorContext) {
      // Audit log viewing of sensitive Customer 360 financial records
      await auditRepository.createLog({
        actorId: actorContext.actorId,
        actorName: actorContext.actorName,
        action: 'VIEW_CUSTOMER_360',
        resourceType: 'CUSTOMER',
        resourceId: String(customer.id),
        requestId: actorContext.requestId,
        outcome: 'SUCCESS',
        metadata: {
          customerCode: customer.customerCode,
          pan: customer.panNumber,
        },
      });
    }

    return data360;
  },

  async getCustomerAccounts(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerAccounts(customer.id);
  },

  async getCustomerLoans(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerLoans(customer.id);
  },

  async getCustomerInteractions(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerInteractions(customer.id);
  },

  async getCustomerCases(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerCases(customer.id);
  },

  async getCustomerOpportunities(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerOpportunities(customer.id);
  },

  async getCustomerScore(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    const score = await customerRepository.getCustomerScore(customer.id);
    if (!score) {
      throw new BankingError('SCORE_NOT_CALCULATED', `Credit/CORE score not calculated for customer '${idOrCode}'.`, 404);
    }
    return score;
  },

  async getCustomerInsights(idOrCode: string | number) {
    const customer = await this.getCustomerById(idOrCode);
    return await customerRepository.getCustomerInsights(customer.id);
  },
};
