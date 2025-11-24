// backend/src/routes/health.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /healthz
router.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true, version: "1.0" });
  } catch (err) {
    console.error("Healthcheck failed:", err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
