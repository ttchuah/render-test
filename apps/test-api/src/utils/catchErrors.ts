import { Request, Response, NextFunction } from 'express';
// serves as try-catch wrapper around an asynchronous function "fn()"
type AsyncFunc = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const catchErrors = (fn: AsyncFunc) => {
    return function (req: Request, res: Response, next: NextFunction) {

        // fn() is asynchronous, so we can append .catch() to catch errors
        return fn(req, res, next).catch(next)
    }
}