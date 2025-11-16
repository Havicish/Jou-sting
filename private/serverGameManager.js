const Sessions = require("./sessionManager.js").Sessions;
const GetPropsAllowedToChange = require("./sessionManager.js").GetPropsAllowedToChange;

class Game {
  constructor(Name) {
    this.Name = Name;
    this.Plrs = [];
  }
}

function FindGame(Name) {
  return Games.find(g => g.Name === Name);
}

function FindSession(Id) {
  for (let Session of Sessions) {
    //console.log(`${Id} ?= ${Session.Id}`);
    if (Session.Id == Id)
      return Session
  }
  return null;
}

let Games = [];

function Start() {
  const AddAPIListener = require("./server.js").AddAPIListener;

  AddAPIListener("JoinGame", (Payload, Socket) => {
    console.log(`Join game ${JSON.stringify(Payload)}`);

    let Session = FindSession(Payload.SessionId);
    if (!Session)
      return { GameName: null, Success: false, Error: "Session not found" };

    let ThisGame = FindGame(Payload.GameName);
    if (!ThisGame) {
      ThisGame = new Game(Payload.GameName);
      Games.push(ThisGame);
    }
    Session.GameName = ThisGame.Name;

    for (let Session2 of Sessions) {
      if (Session2.GameName != ThisGame.Name || Session2.Id == Session.Id)
        continue;

      if (!Session2.GameName && Session2.GameName != "")
        continue;

      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "SessionJoinedGame",
          Payload: { Session }
        }
      }));

      Session.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "SessionJoinedGame",
          Payload: { Session: Session2 }
        }
      }));
    }

    return { GameName: ThisGame.Name };
  });

  AddAPIListener("UpdateSession", (Payload, Socket) => {
    let Session = FindSession(Payload.SessionId);
    if (!Session)
      return { Success: false, Error: "Session not found" };

    let ChangesMade = {};
    for (let Key of Object.keys(Payload.Updates)) {
      if (GetPropsAllowedToChange.indexOf(Key) > 0) {
        ChangesMade[Key] = Payload.Updates[Key];
        Session.Plr[Key] = Payload.Updates[Key];
      } else {
        console.log(`Failed to set ${Key}`);
      }
    }

    for (let Session2 of Sessions) {
      if (Session2.GameName != Session.GameName || Session2.Id == Session.Id)
        continue;
      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "UpdateSession",
          Payload: { SessionId: Session.Id, Updates: ChangesMade }
        }
      }));
    }

    return { Success: true };
  });

  let LastRecTime = Date.now();
  setInterval(() => {
    let Now = Date.now();
    let DT = (Now - LastRecTime) / 1000;
    LastRecTime = Now;

    Games.forEach((Game) => {
      Game.Plrs.forEach((Plr) => {
        Plr.Move1CD = Math.max(0, Plr.Move1CD - DT);
        Plr.Move2CD = Math.max(0, Plr.Move2CD - DT);
      });
    });
  }, 1000 / 60); // 60 times per second
}

module.exports = { Start };