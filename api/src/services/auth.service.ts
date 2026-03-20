import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, findUserById } from '../queries/user.queries';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { JwtPayload } from '../types';

export const register = async (name: string, email: string, password: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error('Email already registered');
    (error as any).statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export const login = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    (error as any).statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    (error as any).statusCode = 401;
    throw error;
  }

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await findUserById(decoded.id);

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);

  return {
    accessToken,
  };
};
