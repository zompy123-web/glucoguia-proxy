const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const PORT = process.env.PORT || 3000;

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

require("http").createServer((req, res) => {
  // Serve the HTML app
  if (req.method === "GET") {
    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
    res.end(html);
    return;
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // Proxy to Anthropic
  if (req.method === "POST" && req.url === "/api") {
    let body = "";
    req.on("data", d => body += d);
    req.on("end", () => {
      const options = {
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
      const proxy = https.request(options, r => {
        let data = "";
        r.on("data", d => data += d);
        r.on("end", () => {
          res.writeHead(200, {"Content-Type": "application/json"});
          res.end(data);
        });
      });
      proxy.on("error", e => {
        res.writeHead(500);
        res.end(JSON.stringify({error: e.message}));
      });
      proxy.write(body);
      proxy.end();
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}).listen(PORT, () => console.log("GlucoGuia running on port " + PORT));
