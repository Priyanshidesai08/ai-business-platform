import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next(
      new ApiError(
        400,
        'Validation failed',
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      )
    );
  }

  req.body = result.data;
  return next();
};
