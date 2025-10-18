import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET in .env file");
  process.exit(1);
}

export const config = {
  jwtSecret: process.env.JWT_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
  port: process.env.PORT || 3000,
};
