// ============================================================
// TypeScript Type Augmentation for Express
// ============================================================
import { IUser } from '../models/User.model';

declare global {
  namespace Express {
    interface User extends IUser {}

    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export {};
