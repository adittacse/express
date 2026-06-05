import express, { type Application, type Request, type Response } from "express";
import { Pool } from "pg";
import config from "./config";

const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: config.connection_string,
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(30),
                email VARCHAR(30) UNIQUE NOT NULL,
                password VARCHAR(20) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                age INT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Database connected successfully");
    } catch (error) {
        console.log(error);
    }
}

initDB();

app.get("/", (req: Request, res: Response) => {
    // res.send("Learning ExpressJS with TypeScript");
    return res.status(200).json({
        message: "Learning ExpressJS with TypeScript",
        author: "Next Level Web Development",
    });
});

app.get("/api/users", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT * FROM users
        `);

        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.rows,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM users WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: result.rows[0],
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
});

app.post("/api/users", async (req: Request, res: Response) => {
    // console.log(req.body);
    const { name, email, password, age } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO users (name, email, password, age) VALUES ($1, $2, $3, $4) RETURNING *
        `, [name, email, password, age]);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: result.rows[0],
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, password, age, is_active } = req.body;

    try {
        const result = await pool.query(`
            UPDATE users SET 
            name = COALESCE($1, name), 
            password = COALESCE($2, password), 
            age = COALESCE($3, age), 
            is_active = COALESCE($4, is_active), 
            updated_at = NOW() 
            WHERE id = $5 RETURNING *
        `, [name, password, age, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: result.rows[0],
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM users WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rowCount !== 1) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: result.rows[0],
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error,
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
