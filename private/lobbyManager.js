function Start() {


const AddAPIListener = require('./server.js').AddAPIListener;

let Lobbies = [] // {Name, Password, [Players], [BannedPlrs], LobbyType, HasStarted}

class Lobby {
  constructor(Name, Password, LobbyType, OwnerId) {
    this.Name = Name;
    this.Password = Password;
    this.LobbyType = LobbyType; // "FreeForAll", "Teams", "Infection", etc.
    this.Players = [];
    this.BannedPlrs = [];
    this.Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("Created Lobby with ID: " + this.Id);
    this.HasStarted = false;
    this.OwnerId = OwnerId;
  }
}

let StartTime = Date.now();
AddAPIListener("/api/createLobby", (Req, Body) => {
  let Data = JSON.parse(Body).Message;
  let NewLobby = new Lobby(Data.Name, Data.Password, Data.LobbyType, Data.SessionId);
  Lobbies.push(NewLobby);
  //console.log(`${Date.now() - StartTime}: Lobby Created: ${Data.Name} | Type: ${Data.LobbyType} | Password: ${Data.Password ? "Yes" : "No"}`);
  return { Response: { Message: "Lobby Created", LobbyId: NewLobby.Id } };
});

AddAPIListener("/api/getJoinableLobbies", (Req, Body) => {
  let Data = JSON.parse(Body).Message;
  let JoinableLobbies = [];
  for (let Lobby of Lobbies) {
    if (!Lobby.HasStarted && !Lobby.BannedPlrs.includes(Data.PlayerName)) {
      JoinableLobbies.push({ Name: Lobby.Name, HasPassword: !!Lobby.Password, Players: Lobby.Players.length, LobbyType: Lobby.LobbyType, Id: Lobby.Id });
      console.log("Lobby ID: " + Lobby.Id);
    }
  }
  return { Response: { Lobbies: JoinableLobbies } };
});

AddAPIListener("/api/setLobbyName", (Req, Body) => {
  let Data = JSON.parse(Body).Message;
  let Lobby = Lobbies.find(lobby => lobby.Id === Data.LobbyId);
  if (Lobby && Lobby.Name !== Data.Name && Lobby) {
    Lobby.Name = Data.Name;
    return { Response: { Success: true } };
  }
  return { Response: { Success: false } };
});

AddAPIListener("/api/getLobbyName", (Req, Body) => {
  let Data = JSON.parse(Body).Message;
  let Lobby = Lobbies.find(lobby => lobby.Id === Data.LobbyId);
  if (Lobby) {
    return { Response: { Success: true, LobbyName: Lobby.Name } };
  }
  return { Response: { Success: false } };
});

}

module.exports = { Start };