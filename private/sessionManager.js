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
    const NewSession = { Id, Socket };
    Sessions.push(NewSession);
    console.log("Session created:", Id);
    return { Id };
  });

  AddAPIListener("UpdateSession", (Payload) => {
    const Session = Sessions.find(s => s.Id === Payload.Id);
    if (Session) {
      Object.keys(Payload.Updates).forEach((Key) => {
        if (Session.PropertiesAllowedToSet.includes(Key)) {
          Session[Key] = Payload.Updates[Key];
        }
      });
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
  Sessions = Sessions.filter(s => s.Socket !== Socket);
  console.log(`Removed ${Before - Sessions.length} session(s)`);
}

module.exports = { Start, SessionDisconnected, Sessions };