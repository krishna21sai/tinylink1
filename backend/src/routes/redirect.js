// backend/src/routes/redirect.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:code([A-Za-z0-9]{6,8})", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `UPDATE url_shortener1
       SET total_clicks = total_clicks + 1,
           last_clicked_at = NOW(),
           updated_at = NOW()
       WHERE code = $1
       RETURNING target_url`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Not found");
    }

    const targetUrl = result.rows[0].target_url;
    return res.redirect(302, targetUrl);
  } catch (err) {
    console.error("Error during redirect:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
