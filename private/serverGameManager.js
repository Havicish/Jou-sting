const GetSessions = require("./sessionManager.js").GetSessions;
const GetPropsAllowedToChange = require("./sessionManager.js").GetPropsAllowedToChange;

class Game {
  constructor(Name) {
    this.Name = Name;
    this.Sessions = [];
  }
}

function FindGame(Name) {
  return Games.find(g => g.Name === Name);
}

function FindSession(Id) {
  for (let Session of GetSessions()) {
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
    try {
      let Session = FindSession(Payload.SessionId);
      let TempSessions = [];
      for (let S of GetSessions()) {
        TempSessions.push(S.Id);
      }

      if (!Session) return { GameName: null, Success: false, Error: "Session not found" };

      let ThisGame = FindGame(Payload.GameName);
      if (!ThisGame) {
        ThisGame = new Game(Payload.GameName);
        Games.push(ThisGame);
      }
      Session.Plr.Id = Session.Id;
      ThisGame.Sessions.push(Session);
      Session.GameName = ThisGame.Name;

      for (let Session2 of GetSessions()) {
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
    } catch (err) {
      console.error(err);
    }
  });

  AddAPIListener("UpdateSession", (Payload, Socket) => {
    try {
      let Session = FindSession(Payload.SessionId);
      if (!Session) return { Success: false, Error: "Session not found" };

      let ChangesMade = {};
      for (let Key of Object.keys(Payload.Updates)) {
        if (GetPropsAllowedToChange().includes(Key)) {
          ChangesMade[Key] = Payload.Updates[Key];
          Session.Plr[Key] = Payload.Updates[Key];
        } else {
          console.log(`Failed to set ${Key}`);
        }
      }

      for (let Session2 of GetSessions()) {
        if (Session2.GameName != Session.GameName || Session2.Id == Session.Id)
          continue;
        Session2.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "ServerUpdateSession",
            Payload: { SessionId: Session.Id, Updates: ChangesMade }
          }
        }));
      }

      return { Success: true };
    } catch (err) {
      return { Success: false, Error: err.message };
    }
  });

  let LastRecTime = Date.now();
  setInterval(() => {
    let Now = Date.now();
    let DT = (Now - LastRecTime) / 1000;
    LastRecTime = Now;

    Games.forEach((Game) => {
      CheckForPlrStabs(Game, DT);
    });
  }, 1000 / 60); // 60 times per second
}

function OnRemoveSession(Socket) {
  let Session = GetSessions().find(s => s.Socket === Socket);
  if (!Session) return;
  
  for (let Game of Games) {
    Game.Plrs = Game.Sessions.filter(Plr => Plr.Id != Session.Id);
  }
}

function Distance(X1, Y1, X2, Y2) {
  return Math.sqrt(Math.pow(X1 - X2, 2) + Math.pow(Y1 - Y2, 2));
}

function CheckForPlrStabs(Game, DT) {
  let ThingsToUpdate = [];
  for (let Session of Game.Sessions) {
    let Plr = Session.Plr;

    for (let Session2 of Game.Sessions) {
      let Plr2 = Session2.Plr;
      if (Plr.Id == Plr2.Id) continue;

      let Dist = Distance(Plr.X + Math.cos(Plr.Rot) * Plr.LanceLength, Plr.Y + Math.sin(Plr.Rot) * Plr.LanceLength, Plr2.X + Math.cos(Plr2.Rot), Plr2.Y + Math.sin(Plr2.Rot));

      if (Dist < 30 && Plr.StabbingCD <= 0) {
        Plr.VelX -= Math.cos(Plr.Rot) * 1000;
        Plr.VelY -= Math.sin(Plr.Rot) * 1000;
        Plr.StabbingCD = 0.25;
        Plr2.VelX += Math.cos(Plr.Rot) * 500;
        Plr2.VelY += Math.sin(Plr.Rot) * 500;

        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { VelX: Plr.VelX, VelY: Plr.VelY } });
        ThingsToUpdate.push({ SessionId: Session2.Id, Updates: { VelX: Plr2.VelX, VelY: Plr2.VelY } });
      }
    }

    Plr.StabbingCD -= DT;
  }

  for (let Session of Game.Sessions) {
    let Updates = ThingsToUpdate.find(t => t.SessionId == Session.Id);
    if (!Updates) continue;
    Session.Socket.send(JSON.stringify({ 
      ServerPush: {
        API: "ServerUpdateSession",
        Payload: Updates
      }
    }));
  }
}

module.exports = { Start, OnRemoveSession };