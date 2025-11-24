// backend/src/routes/links.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function generateRandomCode(length = 6 + Math.floor(Math.random() * 3)) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateRandomCode();
    const result = await pool.query(
      "SELECT 1 FROM url_shortener1 WHERE code = $1",
      [code]
    );
    if (result.rowCount === 0) return code;
  }
  throw new Error("Failed to generate unique code");
}

// POST /api/links  (create)
router.post("/links", async (req, res) => {
  try {
    let { code, targetUrl } = req.body;

    if (!targetUrl || !isValidUrl(targetUrl)) {
      return res
        .status(400)
        .json({ error: "A valid targetUrl (http/https) is required" });
    }

    if (code) {
      if (!CODE_REGEX.test(code)) {
        return res.status(400).json({
          error:
            "Code must be 6–8 characters and contain only A–Z, a–z, 0–9",
        });
      }
      // Check explicitly if custom code already exists to provide a
      // clear 409 response before attempting an insert. This avoids
      // relying solely on a DB unique violation for user-supplied codes.
      const exists = await pool.query(
        "SELECT 1 FROM url_shortener1 WHERE code = $1",
        [code]
      );
      if (exists.rowCount > 0) {
        return res.status(409).json({ error: "Code already exists" });
      }
    } else {
      code = await generateUniqueCode();
    }

    const insertQuery = `
      INSERT INTO url_shortener1 (code, target_url)
      VALUES ($1, $2)
      RETURNING id, code, target_url, total_clicks, last_clicked_at, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [code, targetUrl]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // unique violation on code
      return res.status(409).json({ error: "Code already exists" });
    }
    console.error("Error creating link:", err);
    res.status(500).json({ error: "Failed to create link" });
  }
});

// GET /api/links  (list all links, optional ?search=)
router.get("/links", async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT id, code, target_url, total_clicks, last_clicked_at, created_at, updated_at
      FROM url_shortener1
    `;
    const params = [];

    if (search) {
      sql += " WHERE code ILIKE $1 OR target_url ILIKE $1";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY created_at DESC";

    const result = await pool.query(sql, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching links:", err);
    res.status(500).json({ error: "Failed to fetch links" });
  }
});

// GET /api/links/:code  (stats for a single code)
router.get("/links/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT id, code, target_url, total_clicks, last_clicked_at, created_at, updated_at
       FROM url_shortener1
       WHERE code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching link stats:", err);
    res.status(500).json({ error: "Failed to fetch link stats" });
  }
});

// DELETE /api/links/:code
router.delete("/links/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      "DELETE FROM url_shortener1 WHERE code = $1 RETURNING id",
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting link:", err);
    res.status(500).json({ error: "Failed to delete link" });
  }
});

module.exports = router;
