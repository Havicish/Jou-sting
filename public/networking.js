import { Player } from "./classes/player.js";
import { Camera } from "./render.js";
import { AddUpdater } from "./updaters.js";
import { AddObject, RemoveObject, CreateNewScene, GetAllObjectsInScene, SetScene, AddOnSceneChangeListener, RemoveOnSceneChangeListener } from "./sceneManager.js";

export let SessionsInGame = [];

function FindSession(Id) {
  for (let Session of SessionsInGame) {
    if (Session.Id == Id)
      return Session;
  }
}

class Session {
  constructor() {
    this.Id = null;
    this.Name = "";
    this.ServerSets = {};
    this.Socket = null;
    this.PendingMessages = [];

    this.GameName = null;
    this.Plr = new Player();
    this.Plr.IsClientControlled = true;
    Camera.Tracking = this.Plr;
    Camera.TrackingSpeed = 0.12;

    this.LastPlr = Object.assign({}, this.Plr);

    this.PropertiesAllowedToSet = [
      "Name",
      "X", "Y", "VelX", "VelY", "Rot", "VelRot",
      "Move1", "Move2", "Move1CD", "Move2CD"
    ];
    this.FloatAccuracyThreshold = 0.01; // At what point we consider float changes significant enough to send to server
  }

  SetUp() {
    // Connect WebSocket first
    const Protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const Host = window.location.hostname;
    function isValidIpAddress(ipString) {
      // Regex for IPv4
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

      // Regex for IPv6 (simplified, more comprehensive regex exists for full validation)
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,1}[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,1}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}::[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}::$/;

      return ipv4Regex.test(ipString) || ipv6Regex.test(ipString);
    }
    let Port;
    if (window.location.hostname === "localhost" || isValidIpAddress(window.location.hostname)) {
      Port = ":8080";
    } else {
      Port = "";
    }
    this.Socket = new WebSocket(`${Protocol}//${Host}${Port}`);

    this.Socket.onopen = () => {
      console.log("WebSocket connected");
      // Send a CreateSession request
      this.CallServer("CreateSession", {}, (Response) => {
        this.Id = Response.Id;

        // Flush any queued messages
        while (this.PendingMessages.length > 0) {
          this.Socket.send(JSON.stringify(this.PendingMessages.shift()));
        }

        this.Plr.Id = this.Id;
      });
    };

    // Listen for server messages
    this.Socket.onmessage = (Event) => {
      try {
        const Data = JSON.parse(Event.data);
        if (Data.ServerPush) {
          this.HandleServerPush(Data.ServerPush);
        } else if (Data.API && this.Callbacks[Data.API]) {
          this.Callbacks[Data.API](Data.Result);
          delete this.Callbacks[Data.API];
        }
      } catch (err) {
        console.error("Invalid server message", err);
      }
    };

    // Add this in the SetUp() method after setting up other socket handlers
    this.Socket.onclose = () => {
      console.log("WebSocket disconnected");
      // Clear all remote sessions when we disconnect
      SessionsInGame.forEach(session => {
        if (session.Plr) {
          RemoveObject("Game", session.Plr);
        }
      });
      SessionsInGame.length = 0; // Clear the array
    };

    this.Socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Close socket cleanly when leaving the page
    window.addEventListener("beforeunload", () => {
      if (this.Socket.readyState === WebSocket.OPEN) this.Socket.close();
    });

    this.Callbacks = {};
  }

  CallServer(API, Payload, Callback) {
    Payload.SessionId = this.Id;
    const Message = { API, Payload };

    if (this.Socket.readyState === WebSocket.OPEN) {
      this.Socket.send(JSON.stringify(Message));
    } else {
      // Queue if socket not ready
      this.PendingMessages.push(Message);
    }

    if (Callback) this.Callbacks[API] = Callback;
  }

  HandleServerPush(Data) {
    let API = Data.API;

    if (API == "SessionJoinedGame") {
      let Session = Data.Payload.Session;
      let Plr = new Player();

      Plr = Object.assign(Plr, Session.Plr);
      setTimeout(() => {
        alert(JSON.stringify(Session.Plr));
      }, 2000);

      SessionsInGame.push(Session);

      setTimeout(() => {
        AddObject("Game", Plr);
        for (let Obj of GetAllObjectsInScene("Game")) {
          if (Obj.constructor.name == "BoundingBox") {
            Plr.BoundingBox = Obj;
            break;
          }
        }
      }, 10);
    }

    if (API == "ServerUpdateSession") {
      let Session = FindSession(Data.Payload.SessionId);
      let Updates = Data.Payload.Updates;
      let ExsistingPlr;

      for (let Obj of GetAllObjectsInScene("Game")) {
        if (Obj.Id && Obj.Id == Session.Id) {
          ExsistingPlr = Obj;
        }
      }

      if (!ExsistingPlr) return;

      if (ExsistingPlr.Id != this.Id) {
        for (const Key of Object.keys(Updates)) {
          if (Object.prototype.hasOwnProperty.call(Updates, Key)) {
            if (typeof Updates[Key] == "number") {
              ExsistingPlr.PropsToSmoothTo[Key] = Updates[Key];
            } else {
              ExsistingPlr[Key] = Updates[Key];
            }
          }
        }
      } else {
        for (const Key of Object.keys(Updates)) {
          ExsistingPlr[Key] = Updates[Key];
        }
      }
    }

    if (API == "RemoveSession") {
      let SessionId = Data.Payload.Id;
      
      // Find and remove the player object from the game scene
      let PlayerToRemove = null;
      for (let Obj of GetAllObjectsInScene("Game")) {
        if (Obj.Id && Obj.Id == SessionId) {
          PlayerToRemove = Obj;
          break;
        }
      }
      
      if (PlayerToRemove) {
        RemoveObject("Game", PlayerToRemove);
      } else {
        console.error(`Player with SessionId: ${SessionId} not found in Game scene.`);
      }

      // Remove session from local list
      SessionsInGame = SessionsInGame.filter(s => s.Id !== SessionId);
    }
  }
}

export let ThisSession = new Session();

document.addEventListener("DOMContentLoaded", () => {
  ThisSession.SetUp();
});

let PingList = [];
AddUpdater((DT) => {
  if (ThisSession.Socket && ThisSession.Socket.readyState === WebSocket.OPEN) {
    let Updates = {};

    ThisSession.PropertiesAllowedToSet.forEach((Prop) => {
      const CurrentValue = ThisSession.Plr[Prop];
      const LastValue = ThisSession.LastPlr[Prop];

      if (typeof CurrentValue === "number") {
        if (Math.abs(CurrentValue - LastValue) > ThisSession.FloatAccuracyThreshold) {
          Updates[Prop] = Math.round(CurrentValue / ThisSession.FloatAccuracyThreshold) * ThisSession.FloatAccuracyThreshold;
          ThisSession.LastPlr[Prop] = CurrentValue;
        }
      } else if (CurrentValue !== LastValue) {
        Updates[Prop] = CurrentValue;
        ThisSession.LastPlr[Prop] = CurrentValue;
      }
    });

    if (Object.keys(Updates).length > 0) {
      let StartTime = performance.now();
      if (Object.hasOwn(Updates, "Name"))
        alert(Updates.Name);
      ThisSession.CallServer("UpdateSession", { Updates: Updates }, () => {
        let EndTime = performance.now();
        let Ping = EndTime - StartTime;
        PingList.push(Ping);
        if (PingList.length > 40) PingList.splice(0, PingList.length - 40);
        let AvgPing = PingList.reduce((a, b) => a + b, 0) / PingList.length;
        document.getElementById("PingDisplay").innerText = `Ping: ${Math.round(AvgPing)} ms`;
      });
    }
  }
  ThisSession.LastPlr = Object.assign({}, ThisSession.Plr);
}, null, -100); // Update with priority -100 to run after most other updaters