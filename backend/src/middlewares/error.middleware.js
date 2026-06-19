export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const devStack = process.env.NODE_ENV === 'production' ? undefined : error.stack;

  console.error('[api-error]', {
    statusCode,
    message: error.message,
    details: error.details,
    stack: devStack
  });

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    details: error.details,
    stack: devStack
  });
};
