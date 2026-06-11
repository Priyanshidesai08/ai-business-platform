import { registerUser, loginUser, logoutUser } from '../services/auth.service.js';

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
