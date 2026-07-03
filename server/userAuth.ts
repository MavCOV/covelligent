/**
 * Covelligent User Authentication
 * Real signup, login, session management with bcrypt password hashing.
 */
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { run, get } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "covelligent-user-jwt-2026";
const SALT_ROUNDS = 10;

// Ensure password column exists (migration-safe)
export async function ensureAuthColumns() {
  try {
    await run(`ALTER TABLE users ADD COLUMN password_hash TEXT`, []);
  } catch { /* column already exists */ }
  try {
    await run(`ALTER TABLE users ADD COLUMN avatar TEXT`, []);
  } catch { /* column already exists */ }
}

// POST /api/auth/signup
export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const existing = await get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();

  await run(
    `INSERT INTO users (name, email, plan, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), email.toLowerCase().trim(), "free", password_hash, now]
  );

  const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]) as any;
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, created_at: user.created_at },
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]) as any;
  if (!user || !user.password_hash) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, created_at: user.created_at },
  });
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  res.json({ success: true });
}

// GET /api/auth/me — verify token and return user
export async function getMe(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await get("SELECT * FROM users WHERE id = ?", [payload.userId]) as any;
    if (!user) return res.status(401).json({ message: "User not found" });
    return res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, created_at: user.created_at });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware: require authenticated user
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = payload.userId;
    (req as any).userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
