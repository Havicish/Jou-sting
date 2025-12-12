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

let APIListeners = {};

const Server = Http.createServer((Req, Res) => {
  if (Req.method === "GET") {
    let FilePath = Path.join(PublicDir, Req.url === "/" ? "index.html" : Req.url);
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
});

const WSS = new WebSocket.Server({ server: Server });

let WaitingForClientGotServerPush = [];
WSS.on("connection", (Socket) => {
  Socket.on("message", (Message) => {
    try {
      let Data = JSON.parse(Message);
      let { API, Payload } = Data;

      if (API && APIListeners[API]) {
        let Result = APIListeners[API](Payload, Socket);
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
    const OnRemoveSession = require("./serverGameManager.js").OnRemoveSession;
    OnRemoveSession(Socket);

    SessionDisconnected(Socket);
  });
});

Server.listen(8080, () => console.log("Server running on http://localhost:8080"));

function AddAPIListener(API, Callback) {
  APIListeners[API] = Callback;
}

function ServerPush(Socket, API, Data) {
  let WaitingFor = { Socket, API, Data, Completed: false, Attempts: 0 };
  WaitingForClientGotServerPush.push(WaitingFor);

  const CheckInterval = setInterval(() => {
    WaitingFor.Attempts++;
    console.log(`ServerPush: ${API}    ${WaitingFor.Completed ? "Completed" : "Pending"}`);
    // send the same wrapper other code uses
    Socket.send(JSON.stringify({
      ServerPush: {
        API: API,
        Payload: Data
      }
    }));

    // safety: stop retrying after N attempts so we don't spam forever
    if (WaitingFor.Completed || WaitingFor.Attempts > 50 || Socket.readyState !== Socket.OPEN) {
      const idx = WaitingForClientGotServerPush.indexOf(WaitingFor);
      if (idx !== -1) WaitingForClientGotServerPush.splice(idx, 1);
      clearInterval(CheckInterval);
    }
  }, 100);
}

AddAPIListener("AcknowledgeServerPush", (Payload, Socket) => {
  console.log("AcknowledgeServerPush received for API:", Payload.API);
  //console.log("Current WaitingForClientGotServerPush:", WaitingForClientGotServerPush);
  let API = Payload.API;
  for (let i = 0; i < WaitingForClientGotServerPush.length; i++) {
    let WaitingFor = WaitingForClientGotServerPush[i];
    //console.log(WaitingFor.Socket == Socket && WaitingFor.API == API)
    if (WaitingFor.Socket == Socket && WaitingFor.API == API) {
      WaitingFor.Completed = true;
      break;
    }
  }
});

module.exports = { AddAPIListener, SessionDisconnected, ServerPush };
ServerGameManagerStart();
SessionManagerStart();