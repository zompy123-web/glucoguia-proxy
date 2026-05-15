const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const PORT = process.env.PORT || 3000;

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

require("http").createServer((req, res) => {

  const isApi = req.url === "/api" || req.url.startsWith("/api?");

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // API proxy
  if (req.method === "POST" && isApi) {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", () => {
      console.log("API call received, key length:", API_KEY.length);
      const opts = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body)
        }
      };
      const proxy = https.request(opts, r => {
        let data = "";
        r.on("data", d => data += d);
        r.on("end", () => {
          console.log("Anthropic status:", r.statusCode);
          res.writeHead(200, {"Content-Type": "application/json"});
          res.end(data);
        });
      });
      proxy.on("error", e => {
        console.log("Proxy error:", e.message);
        res.writeHead(500);
        res.end(JSON.stringify({error: e.message}));
      });
      proxy.write(body);
      proxy.end();
    });
    return;
  }

  // Serve HTML app
  res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
  res.end(html);

}).listen(PORT, () => console.log("GlucoGuia OK en puerto " + PORT));
