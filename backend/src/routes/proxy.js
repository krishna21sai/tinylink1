// backend/src/routes/proxy.js
const express = require("express");
const https = require("https");

const router = express.Router();

const REMOTE_URL =
  "https://console.neon.tech/resources/8fkqt/login/custom-theme-keycloakify/dist/assets/index-CWSA6TcE.js";

// GET /proxy/keycloakify.js - fetches the remote script and returns it
// with a permissive CORS header so the browser can load it from your frontend.
router.get("/proxy/keycloakify.js", (req, res) => {
  https
    .get(REMOTE_URL, (remoteRes) => {
      const contentType = remoteRes.headers["content-type"] || "application/javascript";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
      // Stream the remote response directly to the client
      remoteRes.pipe(res);
    })
    .on("error", (err) => {
      console.error("Error fetching remote script:", err);
      res.status(502).send("Bad Gateway");
    });
});

module.exports = router;
