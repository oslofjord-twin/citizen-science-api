import express, { Request, Response, NextFunction } from "express";
import { auth } from "../auth.js";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
  	  headers: req.headers,
    });

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    (req as AuthenticatedRequest).user = session.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
