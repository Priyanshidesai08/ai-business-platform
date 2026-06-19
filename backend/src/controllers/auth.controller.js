import {
  forgotPassword as forgotPasswordService,
  loginUser,
  logoutUser,
  resetPassword as resetPasswordService,
  registerUser,
  updateProfile as updateProfileService
} from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({ message: 'Login successful', ...result });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res) => {
  res.status(200).json({ user: req.user });
};

export const logout = async (req, res, next) => {
  try {
    await logoutUser(req.token);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateProfileService(req.user.id, req.body);
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await forgotPasswordService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await resetPasswordService(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
