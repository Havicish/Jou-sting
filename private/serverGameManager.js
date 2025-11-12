const AddAPIListener = require("./server.js").AddAPIListener;
const Sessions = require("./sessionManager.js").Sessions;

class Game {
  constructor(Name) {
    this.Name = Name;
    this.Players = [];
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
}

module.exports = { Start };