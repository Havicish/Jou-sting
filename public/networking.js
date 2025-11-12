import { Player } from "./classes/player.js";
import { Camera } from "./render.js";

class Session {
  constructor() {
    this.Id = null;
    this.Name = "";
    this.ServerSets = {};
    this.Socket = null;
    this.PendingMessages = [];

    this.GameName = "";
    this.Plr = new Player();
    this.Plr.IsClientControlled = true;
    Camera.Tracking = this.Plr;
  }

  SetUp() {
    // Connect WebSocket first
    const Protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const Host = window.location.hostname;
    const Port = window.location.hostname === 'localhost' ? ':8080' : '';
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
    console.log("Server pushed:", Data);
    // Example: update UI or internal state
  }
}

export let ThisSession = new Session();

document.addEventListener("DOMContentLoaded", () => {
  ThisSession.SetUp();
});