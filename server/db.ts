import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Allow development without database - use in-memory fallback
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "DATABASE_URL must be set in production. Did you forget to provision a database?",
    );
  }
  console.log("⚠️  No DATABASE_URL found - using in-memory storage for development");
  // Create a dummy connection string for development
  process.env.DATABASE_URL = "postgresql://dev:dev@localhost:5432/dev_fallback";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });