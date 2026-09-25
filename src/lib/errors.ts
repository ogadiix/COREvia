export class BankingError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'BankingError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatErrorResponse(err: any, requestId: string = 'REQ-UNKNOWN') {
  if (err instanceof BankingError) {
    return {
      statusCode: err.statusCode,
      body: {
        error: {
          code: err.code,
          message: err.message,
          requestId,
          ...(err.details ? { details: err.details } : {}),
        },
      },
    };
  }

  // Generic sanitized error for database or unhandled exceptions
  console.error('[UNHANDLED_ERROR]', err);
  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'A banking service error occurred. Please contact branch operations.',
        requestId,
      },
    },
  };
}
