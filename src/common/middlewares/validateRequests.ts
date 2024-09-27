import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { ResponseDto } from '../DTO';

export const validateRequest = (schema: z.ZodType): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next(); // Call next to continue the request lifecycle
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract detailed error messages from ZodError
        const validationErrors = error.errors.map(err => {
          return `${err.path.join('.')} - ${err.message}`;
        }).join(', ');

        // Validation error, returning ResponseDto structure
        const response: ResponseDto = {
          data: null,
          status: 400,
          message: `Validation failed: ${validationErrors}`,
        };
        res.status(400).json(response);
      } else {
        console.error('Internal server error:', error);
        // Internal server error, returning ResponseDto structure
        const response: ResponseDto = {
          data: null,
          status: 500,
          message: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  };