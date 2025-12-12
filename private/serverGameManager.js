const GetSessions = require("./sessionManager.js").GetSessions;
const GetPropsAllowedToChange = require("./sessionManager.js").GetPropsAllowedToChange;

class Game {
  constructor(Name) {
    this.Name = Name;
    this.Sessions = [];
    this.Bullets = [];
    this.Caltrops = [];
    this.ChatMessages = [];
  }
}

function FindGame(Name) {
  return Games.find(g => g.Name === Name);
}

function FindSession(Id) {
  for (let Session of GetSessions()) {
    if (Session.Id == Id)
      return Session
  }
  return null;
}

function UpdateAllSessions(Game, SessionId, Updates) {
  for (let Session of Game.Sessions) {
    if (Session.Id == SessionId) continue;
    Session.Socket.send(JSON.stringify({ 
      ServerPush: {
        API: "ServerUpdateSession",
        Payload: { SessionId, Updates }
      }
    }));
  }
}

let Games = [];

function Start() {
  const AddAPIListener = require("./server.js").AddAPIListener;
  const ServerPush = require("./server.js").ServerPush;

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

        let TempSession = Object.assign({}, Session);
        delete TempSession.Socket;
        ServerPush(Session2.Socket, "SessionJoinedGame", { Session: TempSession });

        let TempSession2 = Object.assign({}, Session2);
        delete TempSession2.Socket;
        ServerPush(Session.Socket, "SessionJoinedGame", { Session: TempSession2 });

        setTimeout(() => {
          Session2.Socket.send(JSON.stringify({ 
            ServerPush: {
              API: "AddChatMessage",
              Payload: { Name: "[SERVER]", Hue: null, Message: `${Session.Plr.Name} has joined.` }
            }
          }));
        }, 100);
      }

      setTimeout(() => {
        Session.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "AddChatMessage",
            Payload: { Name: "[SERVER]", Hue: null, Message: `${Session.Plr.Name} has joined.` }
          }
        }));
      }, 100);

      for (let Bullet of ThisGame.Bullets) {
        Session.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "ServerAddObject",
            Payload: { ObjectType: "Bullet", Object: Bullet }
          }
        }));
      }

      for (let Caltrop of ThisGame.Caltrops) {
        Session.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "ServerAddObject",
            Payload: { ObjectType: "Caltrop", Object: Caltrop }
          }
        }));
      }

      for (let ChatMsg of ThisGame.ChatMessages) {
        Session.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "AddChatMessage",
            Payload: { Name: ChatMsg.Name, Hue: ChatMsg.Hue, Message: ChatMsg.Message }
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

  const BulletClass = require("./bullet.js").Bullet;
  AddAPIListener("PlayerShoot", (Payload, Socket) => {
    try {
      let Session = FindSession(Payload.SessionId);
      if (!Session) return { Success: false, Error: "Session not found" };

      let ThisGame = FindGame(Session.GameName);
      if (!ThisGame) return { Success: false, Error: "Game not found" };

      let Plr = Session.Plr;

      let Bullet = new BulletClass(Plr.X, Plr.Y, Plr.Rot, Plr.Id);
      ThisGame.Bullets.push(Bullet);

      for (let Session2 of GetSessions()) {
        if (Session2.GameName != ThisGame.Name)
          continue;

        Session2.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "ServerAddObject",
            Payload: { ObjectType: "Bullet", Object: Bullet }
          }
        }));
      }

      return { Success: true };
    } catch (err) {
      return { Success: false, Error: err.message };
    }
  });

  const CaltropClass = require("./caltrop.js").Caltrop;
  AddAPIListener("PlayerCaltrop", (Payload, Socket) => {
    try {
      let Session = FindSession(Payload.SessionId);
      if (!Session) return { Success: false, Error: "Session not found" };

      let ThisGame = FindGame(Session.GameName);
      if (!ThisGame) return { Success: false, Error: "Game not found" };

      let Plr = Session.Plr;

      let Caltrop = new CaltropClass(Plr.X, Plr.Y, Plr.Id);
      ThisGame.Caltrops.push(Caltrop);

      for (let Session2 of GetSessions()) {
        if (Session2.GameName != ThisGame.Name)
          continue;

        Session2.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "ServerAddObject",
            Payload: { ObjectType: "Caltrop", Object: Caltrop }
          }
        }));
      }

      return { Success: true };
    } catch (err) {
      return { Success: false, Error: err.message };
    }
  });

  AddAPIListener("SendChatMessage", (Payload, Socket) => {
    try {
      let Session = FindSession(Payload.SessionId);
      if (!Session) return { Success: false, Error: "Session not found" };

      let ThisGame = FindGame(Session.GameName);
      if (!ThisGame) return { Success: false, Error: "Game not found" };

      for (let Session2 of GetSessions()) {
        if (Session2.GameName != ThisGame.Name)
          continue;

        Session2.Socket.send(JSON.stringify({ 
          ServerPush: {
            API: "AddChatMessage",
            Payload: { Name: Session.Plr.Name, Hue: Session.Plr.Hue, Message: Payload.Message, X: Session.Plr.X, Y: Session.Plr.Y }
          }
        }));
      }

      ThisGame.ChatMessages.push({ Name: Session.Plr.Name, Hue: Session.Plr.Hue, Message: Payload.Message });

      return { Success: true };
    } catch (err) {
      console.error(err);
      return { Success: false, Error: err.message };
    }
  });

  AddAPIListener("LeaveGame", (Payload, Socket) => {
    try {
      let Session = FindSession(Payload.SessionId);
      if (!Session) return { Success: false, Error: "Session not found" };

      let ThisGame = FindGame(Session.GameName);
      if (!ThisGame) return { Success: false, Error: "Game not found" };

      for (let [i, Session2] of ThisGame.Sessions.entries()) {
        if (Session2.Id == Session.Id) {
          continue;
        }

        Session2.Socket.send(JSON.stringify({
          ServerPush: {
            API: "RemoveSession",
            Payload: { Id: Session.Id }
          }
        }));
      }

      for (let [i, Session2] of ThisGame.Sessions.entries()) {
        if (Session2.Id == Session.Id) {
          ThisGame.Sessions.splice(i, 1);
          break;
        }
      }

      Session.GameName = null;

      setTimeout(() => {
        for (let Session2 of GetSessions()) {
          if (Session2.GameName != ThisGame.Name)
            continue;

          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "AddChatMessage",
              Payload: { Name: "[SERVER]", Hue: null, Message: `${Session.Plr.Name} has left.` }
            }
          }));
        }
      }, 100);

      return { Success: true };
    } catch (err) {
      console.error(err);
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
      PlrDeaths(Game, DT);
      CalcBullets(Game, DT);
      CalcCaltrops(Game, DT);
    });
  }, 1000 / 60); // 60 times per second
}

function OnRemoveSession(Socket) {
  let Session = GetSessions().find(s => s.Socket === Socket);
  if (!Session) {
    console.error("Session not found for disconnected socket");
    return;
  }

  for (let Game of Games) {
    for (let [i, Session2] of Game.Sessions.entries()) {
      let Plr = Session2.Plr;
      let Killer = Game.Sessions.find(s => s.Plr.Id == Plr.LastHitBy);
      if (Killer) {
        Killer.Plr.Health = Math.min(Killer.Plr.Health + 70, Killer.Plr.MaxHealth);
        for (let Session3 of Game.Sessions) {
          Session3.Socket.send(JSON.stringify({
            ServerPush: {
              API: "ServerUpdateSession",
              Payload: { SessionId: Killer.Id, Updates: { Health: Killer.Plr.Health } }
            }
          }));
        }
      }
      if (Session2.Id == Session.Id) {
        Game.Sessions.splice(i, 1);
        return;
      }
    }
  }
  console.log(`Tried to remove session ${Session.Id} from games`);
}

function Distance(X1, Y1, X2, Y2) {
  return Math.sqrt(Math.pow(X1 - X2, 2) + Math.pow(Y1 - Y2, 2));
}

function CheckForPlrStabs(Game, DT) {
  let ThingsToUpdate = [];

  for (let Session of Game.Sessions) {
    let Plr = Session.Plr;

    if (Plr.DeadTime > 0) continue;

    for (let Session2 of Game.Sessions) {
      let Plr2 = Session2.Plr;
      if (Plr.Id == Plr2.Id || Plr2.DeadTime > 0) continue;

      let Dist = Distance(Plr.X + Math.cos(Plr.Rot) * Plr.LanceLength, Plr.Y + Math.sin(Plr.Rot) * Plr.LanceLength, Plr2.X + Math.cos(Plr2.Rot), Plr2.Y + Math.sin(Plr2.Rot));

      if (Dist < 30 && Plr.StabbingCD <= 0) {
        Plr.VelX = Math.cos(Plr.Rot) * -750;
        Plr.VelY = Math.sin(Plr.Rot) * -750;
        Plr.StabbingCD = 0.25;
        Plr2.VelX = Math.cos(Plr.Rot) * 500;
        Plr2.VelY = Math.sin(Plr.Rot) * 500;
        Plr2.Health -= 10;
        Plr2.LastHitBy = Plr.Id;

        for (let Session2 of Game.Sessions) {
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "DamageIndicator",
              Payload: { X: Plr2.X, Y: Plr2.Y, Amount: -10 }
            }
          }));
        }

        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { VelX: Plr.VelX, VelY: Plr.VelY } });
        ThingsToUpdate.push({ SessionId: Session2.Id, Updates: { VelX: Plr2.VelX, VelY: Plr2.VelY, Health: Plr2.Health, LastHitBy: Plr2.LastHitBy } });
      }
    }

    Plr.StabbingCD -= DT;
  }

  for (let Session of Game.Sessions) {
    let Updates = ThingsToUpdate.find(t => t.SessionId == Session.Id);
    if (!Updates) continue;
    for (let Session2 of Game.Sessions) {
      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "ServerUpdateSession",
          Payload: Updates
        }
      }));
    }
  }
}

function PlrDeaths(Game, DT) {
  let ThingsToUpdate = [];

  for (let Session of Game.Sessions) {
    let Plr = Session.Plr;

    if (Plr.Health <= 0 && Plr.DeadTime <= 0) {
      Plr.DeadTime = 10;
      let Killer = Game.Sessions.find(s => s.Plr.Id == Plr.LastHitBy);
      if (Killer) {
        Killer.Plr.Health = Math.min(Killer.Plr.Health + 70, Killer.Plr.MaxHealth);
        for (let Session2 of Game.Sessions) {
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "ServerUpdateSession",
              Payload: { SessionId: Killer.Id, Updates: { Health: Killer.Plr.Health } }
            }
          }));
        }
      }
    }

    if (Plr.DeadTime > 0) {
      Plr.DeadTime -= DT;

      if (Plr.DeadTime <= 0) {
        Plr.Health = Plr.MaxHealth;
        Plr.X = Math.random() * 2000 - 1000;
        Plr.Y = Math.random() * 2000 - 1000;

        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { Health: Plr.Health, X: Plr.X, Y: Plr.Y, DeadTime: -1 } });
      } else {
        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { DeadTime: Plr.DeadTime } });
      }
    }
  }

  for (let Session of Game.Sessions) {
    let Updates = ThingsToUpdate.find(t => t.SessionId == Session.Id);
    if (!Updates) continue;
    for (let Session2 of Game.Sessions) {
      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "ServerUpdateSession",
          Payload: Updates
        }
      }));
    }
  }
}

function CalcBullets(Game, DT) {
  let ThingsToUpdate = [];

  for (let Bullet of Game.Bullets) {
    Bullet.Update(DT);

    if (Bullet.ToRemove) {
      for (let Session2 of Game.Sessions) {
        Session2.Socket.send(JSON.stringify({
          ServerPush: {
            API: "ServerRemoveObject",
            Payload: { ObjectId: Bullet.Id }
          }
        }));
      }
      Game.Bullets = Game.Bullets.filter(b => b !== Bullet);
      continue;
    }

    for (let Session of Game.Sessions) {
      let Plr = Session.Plr;
      if (Plr.DeadTime > 0 || Session.Id == Bullet.OwnerId) continue;

      let Dist = Distance(Bullet.X, Bullet.Y, Plr.X + Math.cos(Plr.Rot), Plr.Y + Math.sin(Plr.Rot));

      if (Dist < 40) {
        let DmgToDeal;
        if (Bullet.TimeAlive < 0.3)
          DmgToDeal = 4;
        else
          DmgToDeal = 10;
        Plr.Health -= DmgToDeal;
        Plr.LastHitBy = Bullet.OwnerId;
        Game.Bullets = Game.Bullets.filter(b => b !== Bullet);
        let DirToBullet = Math.atan2(Bullet.Y - Plr.Y, Bullet.X - Plr.X);
        Plr.VelX += Math.cos(DirToBullet) * -300;
        Plr.VelY += Math.sin(DirToBullet) * -300;

        for (let Session2 of Game.Sessions) {
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "ServerRemoveObject",
              Payload: { ObjectId: Bullet.Id }
            }
          }));
        }

        for (let Session2 of Game.Sessions) {
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "DamageIndicator",
              Payload: { X: Plr.X, Y: Plr.Y, Amount: -DmgToDeal }
            }
          }));
        }

        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { Health: Plr.Health, LastHitBy: Plr.LastHitBy, VelX: Plr.VelX, VelY: Plr.VelY } });
      }
    }
  }

  for (let Session of Game.Sessions) {
    let Updates = ThingsToUpdate.find(t => t.SessionId == Session.Id);
    if (!Updates) continue;
    for (let Session2 of Game.Sessions) {
      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "ServerUpdateSession",
          Payload: Updates
        }
      }));
    }
  }
}

function CalcCaltrops(Game, DT) {
  let ThingsToUpdate = [];

  for (let Caltrop of Game.Caltrops) {
    Caltrop.Update(DT);

    if (Caltrop.ToRemove) {
      Game.Caltrops = Game.Caltrops.filter(c => c !== Caltrop);
      continue;
    }

    for (let Session of Game.Sessions) {
      let Plr = Session.Plr;
      if (Plr.DeadTime > 0 || Session.Id == Caltrop.OwnerId) continue;

      let Dist = Distance(Caltrop.X, Caltrop.Y, Plr.X + Math.cos(Plr.Rot), Plr.Y + Math.sin(Plr.Rot));

      if (Dist < 60) {
        Plr.Health -= 10;
        Plr.LastHitBy = Caltrop.OwnerId;

        let DirToCaltrop = Math.atan2(Caltrop.Y - Plr.Y, Caltrop.X - Plr.X);
        Plr.VelX += Math.cos(DirToCaltrop) * -300;
        Plr.VelY += Math.sin(DirToCaltrop) * -300;

        Game.Caltrops = Game.Caltrops.filter(b => b !== Caltrop);

        for (let Session2 of Game.Sessions) {
          console.log("Removing caltrop due to player hit");
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "ServerRemoveObject",
              Payload: { ObjectId: Caltrop.Id }
            }
          }));
        }

        for (let Session2 of Game.Sessions) {
          Session2.Socket.send(JSON.stringify({
            ServerPush: {
              API: "DamageIndicator",
              Payload: { X: Plr.X, Y: Plr.Y, Amount: -10 }
            }
          }));
        }

        ThingsToUpdate.push({ SessionId: Session.Id, Updates: { Health: Plr.Health, LastHitBy: Plr.LastHitBy, VelX: Plr.VelX, VelY: Plr.VelY } });
      }
    }
  }

  for (let Session of Game.Sessions) {
    let Updates = ThingsToUpdate.find(t => t.SessionId == Session.Id);
    if (!Updates) continue;
    for (let Session2 of Game.Sessions) {
      Session2.Socket.send(JSON.stringify({ 
        ServerPush: {
          API: "ServerUpdateSession",
          Payload: Updates
        }
      }));
    }
  }
}

module.exports = { Start, OnRemoveSession };