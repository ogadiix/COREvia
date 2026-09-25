import { accountRepository, AccountFilterParams } from '../repositories/account.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { BankingError } from '../lib/errors.ts';

export const accountService = {
  async listAccounts(params: AccountFilterParams) {
    return await accountRepository.findMany(params);
  },

  async getAccountById(idOrNumber: string | number, actorContext?: { actorId: string; actorName: string; requestId: string }) {
    let account = null;
    const num = Number(idOrNumber);
    if (!isNaN(num) && num < 1000000) {
      account = await accountRepository.findById(num);
    }
    if (!account) {
      account = await accountRepository.findByAccountNumber(String(idOrNumber));
    }

    if (!account) {
      throw new BankingError('ACCOUNT_NOT_FOUND', `Account '${idOrNumber}' could not be found.`, 404);
    }

    if (actorContext) {
      await auditRepository.log({
        actorId: actorContext.actorId,
        actorName: actorContext.actorName,
        action: 'VIEW_ACCOUNT_DETAIL',
        resourceType: 'ACCOUNT',
        resourceId: String(account.id),
        requestId: actorContext.requestId,
        outcome: 'SUCCESS',
        metadata: {
          maskedAccountNumber: account.maskedAccountNumber,
          accountType: account.accountType,
          customerId: account.customerId,
        },
      });
    }

    return account;
  },

  async getAccountTransactions(
    idOrNumber: string | number,
    params: { page?: number; limit?: number; type?: string; status?: string } = {}
  ) {
    let account = null;
    const num = Number(idOrNumber);
    if (!isNaN(num) && num < 1000000) {
      account = await accountRepository.findById(num);
    }
    if (!account) {
      account = await accountRepository.findByAccountNumber(String(idOrNumber));
    }

    if (!account) {
      throw new BankingError('ACCOUNT_NOT_FOUND', `Account '${idOrNumber}' could not be found.`, 404);
    }

    return await accountRepository.getAccountTransactions(account.id, params);
  },

  async getSummaryStats() {
    return await accountRepository.getSummaryStats();
  },
};
