import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { createUser, findUserByEmail, findUserById, updateUserById } from '../models/user.model.js';
import { createSession, revokeSessionByToken } from '../models/session.model.js';

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, passwordHash });

  return sanitizeUser(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ sub: user.id, role: user.role });
  await createSession({ id: uuidv4(), userId: user.id, token });

  return {
    token,
    user: sanitizeUser(user)
  };
};

export const logoutUser = async (token) => {
  await revokeSessionByToken(token);
};

export const updateProfile = async (userId, payload) => {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  const nextName = payload.name?.trim();
  if (!nextName) {
    throw new ApiError(400, 'Name is required');
  }

  const updatedUser = await updateUserById(userId, { name: nextName });
  return sanitizeUser(updatedUser);
};
