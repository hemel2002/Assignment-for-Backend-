export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string | string[],
    readonly code?: string,
    readonly errors?: unknown
  ) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.name = "HttpError";
    this.publicMessage = message;
  }

  readonly publicMessage: string | string[];
}

export class BadRequestError extends HttpError {
  constructor(message: string | string[], errors?: unknown) {
    super(400, message, "BAD_REQUEST", errors);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message, "NOT_FOUND");
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string) {
    super(429, message, "TOO_MANY_REQUESTS");
  }
}
