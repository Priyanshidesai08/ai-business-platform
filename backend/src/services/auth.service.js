import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';
import { signToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import {
  clearPasswordResetToken,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByResetToken,
  setPasswordResetToken,
  updatePasswordById,
  updateUserById
} from '../models/user.model.js';
import { createSession, revokeSessionByToken } from '../models/session.model.js';
import { sendPasswordResetEmail } from './email.service.js';

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

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return { success: true, message: 'Reset link sent' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const resetLink = `${env.frontendUrl.replace(/\/$/, '')}/reset-password/${rawToken}`;

  await setPasswordResetToken(user.id, { token: tokenHash, expiry });
  await sendPasswordResetEmail({
    to: user.email,
    token: rawToken,
    name: user.name
  });

  return {
    success: true,
    message: 'Reset link sent',
    ...(env.nodeEnv !== 'production' ? { resetLink } : {})
  };
};

export const resetPassword = async ({ token, password }) => {
  if (!token) {
    throw new ApiError(400, 'Reset token is required');
  }
  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await findUserByResetToken(tokenHash);

  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or expired');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await updatePasswordById(user.id, passwordHash);
  await clearPasswordResetToken(user.id);

  return { success: true, message: 'Password reset successful' };
};
