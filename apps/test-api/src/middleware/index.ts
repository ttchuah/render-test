import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';

const secret = process.env.SECRET;

export const checkToken = (req: Request, res: Response, next: NextFunction) => {
    let potentialToken: string|string[] = req.headers['x-access-token'] || req.headers['authorization'];
    let bearerToken = "";

    if (_.isEmpty(potentialToken)) {
        return res.json({
            success: false,
            message: 'You must supply a token'
        });
    }

    // Find a token that starts with "Bearer".
    if (Array.isArray(potentialToken)) {
        for (let i=0; i<potentialToken.length; i++) {
            if (potentialToken[i].startsWith("Bearer")) {
                
                // Slice out the bearer token value.
                bearerToken = potentialToken[i].slice(7, potentialToken.length);
                break;
            }
        }
    }
    
    if (bearerToken) {
        jwt.verify(bearerToken, secret, (err, decoded) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'The token is invalid'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.json({
            success: false,
            message: 'Auth token not supplied.'
        });
    }
};

