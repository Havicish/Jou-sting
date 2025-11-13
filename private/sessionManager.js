const WebSocket = require("ws");

class Session {
  constructor(Id, Socket) {
    this.Id = Id;
    this.Socket = Socket;

    this.ServerSetProps = {};

    this.Name = "";
    this.GameName = "";
    this.X = 0;
    this.Y = 0;
    this.VelX = 0;
    this.VelY = 0;
    this.Rot = 0;
    this.VelRot = 0;
    this.Health = 100;
    this.Move1CD = 3;
    this.Move2CD = 0;
    this.MaxMove1CD = 3;
    this.MaxMove2CD = 3;

    this.PropertiesAllowedToSet = [
      "Name",
      "X", "Y", "VelX", "VelY", "Rot", "VelRot",
      "Move1", "Move2", "Move1CD", "Move2CD"
    ];
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

function Start() {
  const AddAPIListener = require("./server.js").AddAPIListener;
  
  AddAPIListener("CreateSession", (Payload, Socket) => {
    const Id = Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15);
    const NewSession = new Session(Id, Socket);
    
    console.log("Session created:", Id);
    
    for (let ExistingSession of Sessions) {
      console.log("Sending existing session to new client:", ExistingSession.Id);
      Socket.send(JSON.stringify({
        ServerPush: {
          API: "NewSession",
          Payload: { Id: ExistingSession.Id, Data: Object.assign({}, ExistingSession) }
        }
      }));
    }
    
    Sessions.push(NewSession);
  
    for (let Session of Sessions) {
      if (Session.Socket !== Socket && Session.Socket.readyState === WebSocket.OPEN) {
        console.log("Notifying existing session about new session:", Id);
        Session.Socket.send(JSON.stringify({
          ServerPush: {
            API: "NewSession", 
            Payload: { Id: Id, Data: Object.assign({}, NewSession) }
          }
        }));
      }
    }
    
    return { Id };
  });

  AddAPIListener("UpdateSession", (Payload) => {
    const Session = Sessions.find(s => s.Id === Payload.SessionId);
    if (Session) {
      let ChangesMade = {};
      Object.keys(Payload.Updates).forEach((Key) => {
        if (Session.PropertiesAllowedToSet.includes(Key)) {
          Session[Key] = Payload.Updates[Key];
          ChangesMade[Key] = Payload.Updates[Key];
        }
      });
      
      Object.keys(Session.ServerSetProps).forEach((Key) => {
        Session[Key] = Session.ServerSetProps[Key];
      });
      Session.ServerSetProps = {};
      
      Object.keys(ChangesMade).forEach((Key) => {
        if (typeof ChangesMade[Key] === "number") {
          ChangesMade[Key] = parseFloat(ChangesMade[Key].toFixed(5));
        }
      });
      
      // Broadcast to other sessions - FIX THE MESSAGE FORMAT AND LOOP CONDITION
      for (let OtherSession of Sessions) {
        if (OtherSession.Id !== Session.Id && OtherSession.Socket.readyState === WebSocket.OPEN) {
          OtherSession.Socket.send(JSON.stringify({
            ServerPush: {  // Change from API to ServerPush
              API: "UpdateSessions",
              Payload: {
                Id: Session.Id,
                Updates: ChangesMade
              }
            }
          }));
        }
      }
      return { Success: true };
    }
    return { Success: false, Error: "Session not found" };
  });

  AddAPIListener("GetTotalPlrCount", () => {
    return { TotalPlrCount: Sessions.length };
  });

  AddAPIListener("JoinGame", (Payload) => {
    const Session = Sessions.find(s => s.Id === Payload.Id);
    if (Session) {
      Session.GameName = Payload.GameName;
      return { GameName: Payload.GameName };
    }
    return { Error: "Session not found" };
  });
}

function SessionDisconnected(Socket) {
  const Before = Sessions.length;
  
  // Find the disconnected session first
  const DisconnectedSession = Sessions.find(s => s.Socket === Socket);
  const DisconnectedSessionId = DisconnectedSession ? DisconnectedSession.Id : null;
  
  // Remove the session from the array
  Sessions = Sessions.filter(s => s.Socket !== Socket);
  
  // Notify all remaining sessions about the disconnection
  if (DisconnectedSessionId) {
    Sessions.forEach(Session => {
      if (Session.Socket.readyState === WebSocket.OPEN) {
        Session.Socket.send(JSON.stringify({
          ServerPush: {
            API: "RemoveSession",
            Payload: { Id: DisconnectedSessionId }
          }
        }));
      }
    });
  }
  
  console.log(`Removed ${Before - Sessions.length} session(s)`);
}

module.exports = { Start, SessionDisconnected, Sessions };