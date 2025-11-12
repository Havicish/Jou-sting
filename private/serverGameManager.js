const Sessions = require("./sessionManager.js").Sessions;

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
  return Sessions.find(s => s.Id === Id);
}

let Games = [];

function Start() {
  const AddAPIListener = require("./server.js").AddAPIListener;

  AddAPIListener("JoinGame", (Payload, Socket) => {
    const Session = FindSession(Payload.Id);
    if (!Session)
      return;

    let Game = FindGame(Payload.GameName);
    if (!Game) {
      Game = new Game(Payload.GameName);
      Games.push(Game);
      Session.GameName = Game.Name;
    } 
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