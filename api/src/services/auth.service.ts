import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, findUserById } from '../queries/user.queries';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { JwtPayload } from '../types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/AppError';

export const register = async (name: string, email: string, password: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new BadRequestError('Email already registered');
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
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
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
    throw new NotFoundError('User');
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
