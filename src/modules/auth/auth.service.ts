import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const loginUserIntoDB = async (payload: { email: string, password: string }) => {
    const { email, password } = payload;
    
    // 1. check if the user exists
    const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (userData.rows.length === 0) {
        throw new Error("Invalid Credentials!");
    }

    // 2. compare the password
    const user = userData.rows[0];

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword) {
        throw new Error("Invalid Credentials!");
    }

    // 3. generate a token
    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
    };

    const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
        expiresIn: "1d"
    });
    
    const refreshToken = jwt.sign(jwtPayload, config.refresh_secret, {
        expiresIn: "10d"
    });

    return {
        accessToken,
        refreshToken,
    };
}

const generateRefreshToken = async (token: string) => {
    if (!token) {
        throw new Error("Unauthorized access!");
    }

    // 1. verify the token
    const decoded = jwt.verify(token as string, config.refresh_secret) as JwtPayload;

    // 2. find the user into database
    const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [decoded.email]);

    if (userData.rows.length === 0) {
        throw new Error("User not found!");
    }

    // 3. check the user is active or not
    const user = userData.rows[0];

    if (user?.is_active === false) {
        throw new Error("Forbidden access!");
    }

    // 4. generate a token
    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
    };

    const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
        expiresIn: "1d"
    });

    return {
        accessToken,
    }
}

export const authService = {
    loginUserIntoDB,
    generateRefreshToken,
}