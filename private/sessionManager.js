const WebSocket = require("ws");

class Player {
  constructor() {
    this.Id = null;
    this.Name = "";
    this.X = 0;
    this.Y = 0;
    this.VelX = 0;
    this.VelY = 0;
    this.Rot = 0;
    this.VelRot = 0;
    this.Health = 50;
    this.Move1CD = 3;
    this.Move2CD = 0;
    this.MaxMove1CD = 3;
    this.MaxMove2CD = 3;
    this.Speed = 1400;
    this.Drag = 1.06;
    this.TurnSpeed = 6.5;
    this.LanceLength = 60;
    this.BoundingBox = null;
    this.StabbingCD = 0;
    this.Hue = 0;
    this.DeadTime = 0;

    this.IsClientControlled = false;
  }
}

class Session {
  constructor(Id, Socket) {
    this.Id = Id;
    this.Socket = Socket;

    this.ServerSetProps = {};

    this.GameName = null;

    this.Plr = new Player();
    this.Plr.Id = this.Id;

    this.PropertiesAllowedToSet = GetPropsAllowedToChange();
  }

  ServerSetProp(Prop, Value) {
    this[Prop] = Value;
    this.ServerSetProps[Prop] = Value;
  }

  ServerSetPlrProp(Prop, Value) {
    this[Prop] = Value;
    this.ServerSetProps.Plr[Prop] = Value;
  }
}

let Sessions = [];

function FindSession(Id) {
  for (let Session of Sessions) {
    if (Session.Id == Id) {
      return Session;
    }
  }
}

function Start() {
  const AddAPIListener = require("./server.js").AddAPIListener;
  
  AddAPIListener("CreateSession", (Payload, Socket) => {
    let Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let NewSession = new Session(Id, Socket);
    
    console.log("Session created:", Id);
    
    Sessions.push(NewSession);
    
    return { Id };
  });

  AddAPIListener("GetTotalPlrCount", () => {
    return { TotalPlrCount: Sessions.length };
  });

  AddAPIListener("Ping", () => {
    return { Success: true };
  });
}

function SessionDisconnected(Socket) {
  // Find the disconnected session first
  let DisconnectedSession = Sessions.find(s => s.Socket === Socket);
  let DisconnectedSessionId = DisconnectedSession ? DisconnectedSession.Id : null;
  
  // Remove the session from the array
  Sessions = Sessions.filter(s => s.Socket !== Socket);
  
  // Notify all remaining sessions about the disconnection
  if (DisconnectedSessionId) {
    Sessions.forEach(Session => {
      if (Session.Socket.readyState === WebSocket.OPEN && DisconnectedSession.GameName == Session.GameName) {
        Session.Socket.send(JSON.stringify({
          ServerPush: {
            API: "RemoveSession",
            Payload: { Id: DisconnectedSessionId }
          }
        }));
      }
    });
  }
}

function GetSessions() {
  return Sessions;
}

function GetPropsAllowedToChange() {
  return [
      "Name", "Hue",
      "X", "Y", "VelX", "VelY", "Rot", "VelRot",
      "Move1", "Move2", "Move1CD", "Move2CD"
    ];
}

module.exports = { Start, SessionDisconnected, GetSessions, GetPropsAllowedToChange };