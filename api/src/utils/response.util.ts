import { Response } from 'express';
import { ApiResponse } from '../types';

export const success = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode: number = 500
): Response => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    message,
  };
  return res.status(statusCode).json(response);
};
