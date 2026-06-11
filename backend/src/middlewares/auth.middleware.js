import { findUserById } from '../models/user.model.js';
import { findActiveSessionByToken } from '../models/session.model.js';
import { ApiError } from '../utils/apiError.js';
import { verifyToken } from '../utils/token.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }

    const token = header.split(' ')[1];
    const payload = verifyToken(token);
    const session = await findActiveSessionByToken(token);

    if (!session) {
      throw new ApiError(401, 'Session is no longer active');
    }

    const user = await findUserById(payload.sub);

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Unauthorized'));
  }
};

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }

  return next();
};
