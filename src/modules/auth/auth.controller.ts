import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

/* =======================
   REGISTER
======================= */
export async function register(req: Request, res: Response) {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname)
    return res.status(400).json({ message: "Uzupełnij wszystkie pola!" });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return res.status(409).json({
      message: "Taki użytkownik już istnieje! Spróbuj się zalogować.",
    });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, nickname },
  });

  return res.status(201).json({
    message: "Rejestracja zakończona pomyślnie!",
    user: { id: user.id, email: user.email, nickname: user.nickname },
  });
}

/* =======================
   LOGIN
======================= */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Podaj e-mail i hasło!" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res
      .status(401)
      .json({ message: "Nieprawidłowy e-mail lub hasło." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res
      .status(401)
      .json({ message: "Nieprawidłowy e-mail lub hasło." });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "2h",
  });

  return res.status(200).json({
    message: "Zalogowano pomyślnie!",
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname },
  });
}

/* =======================
   ME (User info)
======================= */
export async function me(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Brak tokena autoryzacji." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nickname: true, createdAt: true },
    });

    if (!user)
      return res.status(404).json({ message: "Nie znaleziono użytkownika." });

    res.json({ user });
  } catch {
    res.status(401).json({ message: "Nieprawidłowy lub wygasły token." });
  }
}

/* =======================
   CHANGE PASSWORD
======================= */
export async function changePassword(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Brak tokena." });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    const { newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ message: "Podaj nowe hasło." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed },
    });

    res.json({ message: "Hasło zostało zmienione pomyślnie!" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Błąd autoryzacji." });
  }
}
