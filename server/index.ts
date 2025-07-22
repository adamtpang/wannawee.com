console.log("🚀 Starting WannaWee server...");
console.log("📍 Current working directory:", process.cwd());
console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

import express, { type Request, Response, NextFunction } from "express";

console.log("✅ Express imported");

import { registerRoutes } from "./routes";

console.log("✅ Routes imported");

import { setupVite, serveStatic, log } from "./vite";

console.log("✅ Vite utils imported");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("🔍 App environment:", app.get("env"));
  console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
  
  if (app.get("env") === "development") {
    console.log("🔧 Starting development mode with Vite...");
    await setupVite(app, server);
  } else {
    console.log("🏭 Starting production mode with static files...");
    serveStatic(app);
  }

  // Use Railway's dynamic port or fallback to 5000 for local dev
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
