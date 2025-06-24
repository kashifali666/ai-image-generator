import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import connectDB from "./mongodb/connect.js";
import postRoutes from "./routes/postRoutes.js";
import dalleRoutes from "./routes/dalleRoutes.js";
import path from "path";

dotenv.config();

const app = express();

// --- Add global error handlers (good practice for stability) ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION!", reason);
  // process.exit(1); // Optionally exit for critical unhandled rejections
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION!", err);
  // process.exit(1); // Optionally exit for critical uncaught exceptions
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? null : "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// API Routes
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/dalle", dalleRoutes);

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === "production") {
  // Define __dirname for ES Modules
  const __filename = new URL(import.meta.url).pathname;
  const __dirname = path.dirname(__filename);

  // Correctly resolve the path to the frontend's 'dist' directory
  // Assuming frontend is sibling to backend: project-root/frontend/dist
  // And backend/index.js is in project-root/backend/index.js
  const buildPath = path.join(__dirname, "..", "frontend", "dist");

  // Log the paths for debugging on Render
  console.log(`DEBUG: __dirname is: ${__dirname}`);
  console.log(`DEBUG: buildPath for static files is: ${buildPath}`);

  // Serve static files from the frontend's dist folder
  app.use(express.static(buildPath));

  // Catch-all route to serve the frontend's index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  // In development, serve a simple message for the root path if not handled by API
  app.get("/", async (req, res) => {
    res.status(200).json({
      message: "Hello from DALL.E backend in Development!",
    });
  });
}

const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL); // Ensure MONGODB_URL is set in Render env vars

    // Use process.env.PORT for Render, fallback to 8080 for local dev
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error("Error starting server:", error); // Use console.error for errors
    process.exit(1); // Exit if connection or server fails
  }
};

startServer();
