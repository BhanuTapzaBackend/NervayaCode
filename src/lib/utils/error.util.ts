export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  error: unknown;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      error: null,
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name: string }).name === 'MongoServerError' &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    return {
      message: 'User already exists',
      statusCode: 400,
      error: null,
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name: string }).name === 'ValidationError' &&
    'errors' in error
  ) {
    const validationError = error as {
      errors: Record<string, { message: string }>;
    };
    const message = Object.values(validationError.errors)
      .map((err) => err.message)
      .join(', ');
    return {
      message,
      statusCode: 400,
      error: validationError.errors,
    };
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return {
    message: 'Internal server error',
    statusCode: 500,
    error: errorMessage,
  };
}
