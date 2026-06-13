import { ApiError } from '../utils/apiError.js';

export const requireAuth = (roles = []) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  if (roles.length && !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }

  return next();
};
