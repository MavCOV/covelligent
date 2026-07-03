// Admin authentication middleware
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "covelligent-admin-2026";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "covelligent-jwt-secret-change-in-production";

export function adminLogin(req: Request, res: Response) {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, expiresIn: 86400 });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { role: string };
    if (payload.role !== "admin") throw new Error("Not admin");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("covelligent_admin_token");
}
