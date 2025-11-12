const Http = require("http");
const Fs = require("fs");
const Path = require("path");
const WebSocket = require("ws");
const SessionManagerStart = require("./sessionManager.js").Start;
const ServerGameManagerStart = require("./serverGameManager.js").Start;
const { SessionDisconnected } = require("./sessionManager.js");

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

const APIListeners = {};

const Server = Http.createServer((Req, Res) => {
  if (Req.method === "GET") {
    const FilePath = Path.join(PublicDir, Req.url === "/" ? "index.html" : Req.url);
    const Ext = Path.extname(FilePath).toLowerCase();
    const ContentType = MimeTypes[Ext] || "application/octet-stream";

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
});

const WSS = new WebSocket.Server({ server: Server });

WSS.on("connection", (Socket) => {
  console.log("Client connected");

  Socket.on("message", (Message) => {
    try {
      const Data = JSON.parse(Message);
      const { API, Payload } = Data;

      if (API && APIListeners[API]) {
        const Result = APIListeners[API](Payload, Socket);
        if (Result !== undefined) {
          Socket.send(JSON.stringify({ API, Result }));
        }
      } else {
        Socket.send(JSON.stringify({ error: "Unknown API" }));
      }
    } catch (err) {
      Socket.send(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  Socket.on("close", () => {
    console.log("Client disconnected");
    SessionDisconnected(Socket);
  });
});

Server.listen(8080, () => console.log("Server running on http://localhost:8080"));

function AddAPIListener(API, Callback) {
  APIListeners[API] = Callback;
}

module.exports = { AddAPIListener, SessionDisconnected };
ServerGameManagerStart();
SessionManagerStart();