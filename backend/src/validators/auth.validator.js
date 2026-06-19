import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Email must be valid'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters')
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email must be valid')
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});
