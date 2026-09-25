import { loanRepository, LoanFilterParams } from '../repositories/loan.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { BankingError } from '../lib/errors.ts';

export const loanService = {
  async listLoans(params: LoanFilterParams) {
    return await loanRepository.findMany(params);
  },

  async getLoanById(idOrNumber: string | number, actorContext?: { actorId: string; actorName: string; requestId: string }) {
    let loan = null;
    const num = Number(idOrNumber);
    if (!isNaN(num) && num < 1000000) {
      loan = await loanRepository.findById(num);
    }
    if (!loan) {
      loan = await loanRepository.findByAccountNumber(String(idOrNumber));
    }

    if (!loan) {
      throw new BankingError('LOAN_NOT_FOUND', `Loan account '${idOrNumber}' could not be found.`, 404);
    }

    if (actorContext) {
      await auditRepository.log({
        actorId: actorContext.actorId,
        actorName: actorContext.actorName,
        action: 'VIEW_LOAN_DETAIL',
        resourceType: 'LOAN',
        resourceId: String(loan.id),
        requestId: actorContext.requestId,
        outcome: 'SUCCESS',
        metadata: {
          loanAccountNumber: loan.loanAccountNumber,
          loanType: loan.loanType,
          customerId: loan.customerId,
          outstandingPrincipal: loan.outstandingPrincipal,
        },
      });
    }

    return loan;
  },

  async getLoanRepayments(idOrNumber: string | number, params: { page?: number; limit?: number } = {}) {
    let loan = null;
    const num = Number(idOrNumber);
    if (!isNaN(num) && num < 1000000) {
      loan = await loanRepository.findById(num);
    }
    if (!loan) {
      loan = await loanRepository.findByAccountNumber(String(idOrNumber));
    }

    if (!loan) {
      throw new BankingError('LOAN_NOT_FOUND', `Loan account '${idOrNumber}' could not be found.`, 404);
    }

    return await loanRepository.getLoanRepayments(loan.id, params);
  },

  async getSummaryStats() {
    return await loanRepository.getSummaryStats();
  },
};
