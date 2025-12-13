import { Player } from "./classes/player.js";
import { Camera } from "./render.js";
import { AddUpdater } from "./updaters.js";
import { AddObject, RemoveObject, CreateNewScene, GetAllObjectsInScene, SetScene, AddOnSceneChangeListener, RemoveOnSceneChangeListener } from "./sceneManager.js";
import { GameState } from "./main.js";
import { MainConsole } from "./consoleManager.js";
import { Bullet } from "./classes/bullet.js";
import { Caltrop } from "./classes/caltrop.js";
import { AddChatMessage } from "./scenes/gameScene.js";
import { DamageIndicator } from "./classes/damageIndicator.js";
//import { Server } from "ws";
//import { Server } from "ws";

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

    this.GotServerPushes = [];

    this.LastPlr = Object.assign({}, this.Plr);

    this.PropertiesAllowedToSet = [
      "Name", "Hue",
      "X", "Y", "VelX", "VelY", "Rot", "VelRot",
      "Move1", "Move2", "Move1CD", "Move2CD", "MaxMove1CD", "MaxMove2CD"
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
      MainConsole.Log("WebSocket connected");
      // Send a CreateSession request
      this.CallServer("CreateSession", {}, (Response) => {
        this.Id = Response.Id;
        MainConsole.Log(`Your session id: ${this.Id}`);

        // Flush any queued messages
        while (this.PendingMessages.length > 0) {
          this.Socket.send(JSON.stringify(this.PendingMessages.shift()));
        }

        this.Plr.Id = this.Id;

        SessionsInGame.push(this);
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

    this.Socket.onclose = () => {
      console.log("WebSocket disconnected");
      MainConsole.Log("WebSocket disconnected");
      // Clear all remote sessions when we disconnect
      SessionsInGame.forEach(session => {
        if (session.Plr) {
          RemoveObject("Game", session.Plr);
        }
      });
      SessionsInGame.length = 0; // Clear the array

      CreateNewScene("Disconnected");
      SetScene("Disconnected");
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
      this.PendingMessages.push(Message);
    }

    if (Callback) {
      this.Callbacks[API] = Callback;
      
      // Add timeout to prevent callback leak
      setTimeout(() => {
        if (this.Callbacks[API]) {
          delete this.Callbacks[API];
        }
      }, 30000); // 30 second timeout
    }
  }

  HandleServerPush(Data) {
    let API = Data.API;

    ThisSession.CallServer("AcknowledgeServerPush", { API: API }, () => {});
    let FoundPush = false;
    for (let i = 0; i < this.GotServerPushes.length; i++) {
      let Push = this.GotServerPushes[i];
      if (Push.ServerPushId == Data.ServerPushId && Data.ServerPushId != undefined) {
        MainConsole.Warn(`Ignoring duplicate ServerPush: ${API} Id: ${Data.ServerPushId}`);
        FoundPush = true;
        break;
      }
    }
    this.GotServerPushes.push({ ServerPushId: Data.ServerPushId });

    if (FoundPush) return;

    if (API == "SessionJoinedGame") {
      let Session = Data.Payload.Session;
      let Plr = new Player();

      Plr = Object.assign(Plr, Session.Plr);
      Plr.Id = Session.Id;
      Plr.IsClientControlled = false;
      console.log(Session);
      //MainConsole.Log(JSON.stringify(Session) + " joined the game.");

      SessionsInGame.push(Session);

      if (!FindSession(ThisSession.Id)) {
        SessionsInGame.push(ThisSession);
      }

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
      ServerUpdateSession(this, Data);
    }

    if (API == "RemoveSession") {
      try {
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
        MainConsole.Log(`Removed ${PlayerToRemove.Name} from the game.`);
      } else {
        console.error(`Player with SessionId: ${SessionId} not found in Game scene.`);
        MainConsole.Error(`Player with SessionId: ${SessionId} not found in Game scene.`);
      }

      // Remove session from local list
      SessionsInGame = SessionsInGame.filter(s => s.Id !== SessionId);
      } catch (err) { console.error(err); }
    }

    if (API == "ServerAddObject") {
      let ObjData = Data.Payload.Object;
      let ObjType = Data.Payload.ObjectType;
      let Obj;

      if (GameState.CurrentScene == "Game") {
        if (ObjType == "Bullet") {
          Obj = new Bullet();
          Obj = Object.assign(Obj, ObjData);
          AddObject("Game", Obj);
        }
        if (ObjType == "Caltrop") {
          Obj = new Caltrop();
          Obj = Object.assign(Obj, ObjData);
          AddObject("Game", Obj);
        }
      } else {
        let Listener = AddOnSceneChangeListener("Game", () => {
          if (ObjType == "Bullet") {
            Obj = new Bullet();
            Obj = Object.assign(Obj, ObjData);
            AddObject("Game", Obj);
          }
          if (ObjType == "Caltrop") {
            Obj = new Caltrop();
            Obj = Object.assign(Obj, ObjData);
            AddObject("Game", Obj);
          }
          RemoveOnSceneChangeListener("Game", Listener);
        });
      }
    }

    if (API == "ServerRemoveObject") {
      let ObjectId = Data.Payload.ObjectId;
      for (let Obj of GetAllObjectsInScene("Game")) {
        MainConsole.Log(`Checking object with Id: ${Obj.Id} against ObjectId to remove: ${ObjectId}`);
        if (Obj.Id == ObjectId) {
          RemoveObject("Game", Obj);
          break;
        }
      }
    }

    if (API == "ServerUpdateObject") {
      let ObjectId = Data.Payload.ObjectId;
      let Updates = Data.Payload.Updates;
      for (let Obj of GetAllObjectsInScene("Game")) {
        if (Obj.Id == ObjectId) {
          Object.assign(Obj, Updates);
          break;
        }
      }
    }

    if (API == "AddChatMessage") {
      let Name = Data.Payload.Name;
      let Hue = Data.Payload.Hue;
      let Message = Data.Payload.Message;
      let X = Data.Payload.X;
      let Y = Data.Payload.Y;
      AddChatMessage(Name, Hue, Message, X, Y);
    }

    if (API == "DamageIndicator") {
      let X = Data.Payload.X;
      let Y = Data.Payload.Y;
      let Amount = Data.Payload.Amount;
      let Indicator = new DamageIndicator(X, Y, Amount);
      AddObject("Game", Indicator);
    }

    if (API == "ForceReload") {
      window.location.reload();
    }
  }
}

export let ThisSession = new Session();

document.addEventListener("DOMContentLoaded", () => {
  ThisSession.SetUp();
});

let PingList = [];
let TimeUntilNextUpdate = 0;
AddUpdater((DT) => {
  TimeUntilNextUpdate -= DT;
  if (TimeUntilNextUpdate > 0) return;
  TimeUntilNextUpdate = 1/120;
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
      ThisSession.CallServer("UpdateSession", { Updates: Updates }, () => {});
    }

    let StartTime = performance.now();
    ThisSession.CallServer("Ping", { Updates: Updates }, () => {
      let EndTime = performance.now();
      let Ping = EndTime - StartTime;
      PingList.push(Ping);
      if (PingList.length > 40) PingList.splice(0, PingList.length - 40);
      let AvgPing = PingList.reduce((a, b) => a + b, 0) / PingList.length;
      document.getElementById("PingDisplay").innerText = `Ping: ${Math.round(AvgPing)} ms`;

      if (AvgPing < 15)
        document.getElementById("PingDisplay").style.color = "#0f0";
      else if (AvgPing < 40)
        document.getElementById("PingDisplay").style.color = "#ff0";
      else
        document.getElementById("PingDisplay").style.color = "#f00";
    });

    if (GameState.CurrentScene == "Game")
      document.getElementById("PingDisplay").style.display = "block";
    else
      document.getElementById("PingDisplay").style.display = "none";
  }
  ThisSession.LastPlr = Object.assign({}, ThisSession.Plr);
}, null, -100); // Update with priority -100 to run after most other updaters



let NeededUpdatesForNonExistantPlr = {};
function ServerUpdateSession(ThisSession, Data) {
  let Session = FindSession(Data.Payload.SessionId);
  let Updates = Data.Payload.Updates;
  let ExsistingPlr;

  if (!Session) {
    console.error(`Session with Id: ${Data.Payload.SessionId} not found.`);
    return;
  }

  for (let Obj of GetAllObjectsInScene("Game")) {
    if (Obj.Id && Obj.Id == Session.Id) {
      ExsistingPlr = Obj;
    }
  }

  if (!ExsistingPlr) {
    MainConsole.Log(`Player with SessionId: ${Session.Id} not found in Game scene. Caching updates.`);
    if (!NeededUpdatesForNonExistantPlr[Session.Id]) {
      NeededUpdatesForNonExistantPlr[Session.Id] = {};
    }
    for (const Key of Object.keys(Updates)) {
      NeededUpdatesForNonExistantPlr[Session.Id][Key] = Updates[Key];
    }
    return;
  }

  // Merge cached updates if they exist
  if (NeededUpdatesForNonExistantPlr[Session.Id]) {
    MainConsole.Log(`Applying cached updates: ${JSON.stringify(NeededUpdatesForNonExistantPlr[Session.Id])} to player: ${ExsistingPlr.Name}`);
    for (const Key of Object.keys(NeededUpdatesForNonExistantPlr[Session.Id])) {
      if (Object.prototype.hasOwnProperty.call(NeededUpdatesForNonExistantPlr[Session.Id], Key)) {
        Updates[Key] = NeededUpdatesForNonExistantPlr[Session.Id][Key];
      }
    }
    // Clean up after using the cached updates
    delete NeededUpdatesForNonExistantPlr[Session.Id];
  }

  if (ExsistingPlr.Id != ThisSession.Id) {
    MainConsole.Log(`Applying updates: ${JSON.stringify(Updates)} to player: ${ExsistingPlr.Name}`);
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
    // Use what the server sent to this session, due to Health, Collisions, and other server stuff.
    // This is to prevent cheating. Because if everything is client side, people can just modify their client to do whatever.
    for (const Key of Object.keys(Updates)) {
      if (Object.hasOwn(ThisSession.Plr, Key)) {
        ThisSession.Plr[Key] = Updates[Key];
      }
    }
  }
}