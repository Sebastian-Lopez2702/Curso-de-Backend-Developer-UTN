import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../interfaces/auth';

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] });

export const decodeToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  return { userId: decoded.userId, role: decoded.role };
};
