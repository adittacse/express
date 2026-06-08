import jwt, { type JwtPayload } from "jsonwebtoken";
import { type NextFunction, type Request, type Response } from "express";
import config from "../config";
import { pool } from "../db";

const auth = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // console.log("This is protected route");
            // 1. check if the token exists
            const token = req.headers.authorization;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access!",
                });
            }

            // 2. verify the token
            const decoded = jwt.verify(token as string, config.jwt_secret) as JwtPayload;

            // 3. find the user into database
            const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);

            if (userData.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found!",
                });
            }

            // 4. check the user is active or not
            const user = userData.rows[0];

            if (user.is_active === false) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden access!",
                });
            }

            req.user = decoded;

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default auth;
