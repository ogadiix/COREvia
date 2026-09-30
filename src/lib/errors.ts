export class BankingError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(
    codeOrStatusCode: string | number,
    message: string,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'BankingError';
    if (typeof codeOrStatusCode === 'number') {
      this.statusCode = codeOrStatusCode;
      this.code =
        codeOrStatusCode >= 500
          ? 'INTERNAL_SERVER_ERROR'
          : codeOrStatusCode === 404
            ? 'NOT_FOUND'
            : codeOrStatusCode === 403
              ? 'FORBIDDEN'
              : codeOrStatusCode === 401
                ? 'UNAUTHORIZED'
                : 'BAD_REQUEST';
      this.details = details;
    } else {
      this.code = codeOrStatusCode;
      this.statusCode = statusCode;
      this.details = details;
    }
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
