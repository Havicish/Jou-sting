const Http = require("http");
const Fs = require("fs");
const Path = require("path");
const SessionManagerStart = require("./sessionManager.js").Start
const LobbyManagerStart = require("./lobbyManager.js").Start

const PublicDir = Path.join(__dirname, "../public");

const MimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon"
};

let APIListeners = {};

const Server = Http.createServer((Req, Res) => {
  if (Req.method == "GET") {
    let FilePath = Path.join(PublicDir, Req.url == "/" ? "index.html" : Req.url);
    let Ext = Path.extname(FilePath).toLowerCase();
    let ContentType = MimeTypes[Ext] || "application/octet-stream";

    Fs.readFile(FilePath, (Err, Data) => {
      if (Err) {
        Res.writeHead(404, { "Content-Type": "text/plain" });
        Res.end("404 Not Found");
      } else {
        Res.writeHead(200, { "Content-Type": ContentType });
        Res.end(Data);
      }
    });
  }

  // Handle API requests
  if (Req.method == "POST") {
    for (let API in APIListeners) {
      if (Req.url.startsWith(API)) {
        let Body = [];
        Req.on("data", (Chunk) => {
          Body.push(Chunk);
        }).on("end", () => {
          Body = Buffer.concat(Body).toString();
          let ResponseData = APIListeners[API](Req, Body);
          Res.writeHead(200, { "Content-Type": "application/json" });
          Res.end(JSON.stringify(ResponseData));
        });
        return; // Prevent further processing
      }
    }
  }
});

Server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

function AddAPIListener(API, Callback) {
  APIListeners[API] = Callback;
}

module.exports = { AddAPIListener };

SessionManagerStart();
LobbyManagerStart();