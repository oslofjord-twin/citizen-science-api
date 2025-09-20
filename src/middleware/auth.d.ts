import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        name: string;
    };
}
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map