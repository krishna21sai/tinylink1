// backend/src/app.js
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health");
const linkRoutes = require("./routes/links");
const proxyRoutes = require("./routes/proxy");
const redirectRoutes = require("./routes/redirect");

const app = express();

// CORS + JSON
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

// Simple logger
app.use((req, _res, next) => {
  console.log(req.method, req.path);
  next();
});

// Routes
app.use(healthRoutes);          // /healthz
app.use(proxyRoutes);           // /proxy/keycloakify.js (mount proxy before redirect)
app.use("/api", linkRoutes);    // /api/links...
app.use(redirectRoutes);        // /:code (redirect)

module.exports = app;
