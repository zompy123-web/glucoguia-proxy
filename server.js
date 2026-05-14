const https = require("https");

const API_KEY = process.env.ANTHROPIC_API_KEY || "";

require("http").createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }

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
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(data);
      });
    });
    proxy.on("error", e => { res.writeHead(500); res.end(JSON.stringify({error: e.message})); });
    proxy.write(body);
    proxy.end();
  });
}).listen(process.env.PORT || 3000, () => console.log("GlucoGuía proxy running"));
