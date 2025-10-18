import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// 🔹 Typ rozszerzający obiekt Request o dane użytkownika
export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; nickname: string };
}

// 🔹 Middleware weryfikujący JWT
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Brak tokena autoryzacji" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "tajny_klucz"; // użyj .env jeśli masz

    const decoded = jwt.verify(token, secret) as { id: number; email: string; nickname: string };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      nickname: decoded.nickname,
    };

    next();
  } catch (err) {
    console.error("❌ Błąd autoryzacji:", err);
    return res.status(401).json({ message: "Nieprawidłowy token lub brak dostępu" });
  }
}
