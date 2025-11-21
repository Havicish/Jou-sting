import { AddObject, RemoveObject, SetScene, CreateNewScene, ClearScene, Scenes, AddOnSceneChangeListener } from "../sceneManager.js"
import { AddUpdater } from "../updaters.js"
import { GameState } from "../main.js";
import { SetCookie, GetCookie } from "../cookiesManager.js";
import { ThisSession, SessionsInGame } from "../networking.js";
import { Player } from "../classes/player.js";
import { BoundingBox } from "../classes/boundingBox.js";
import { Camera } from "../render.js";
import { MainConsole } from "../consoleManager.js";
import { IsKeyDown } from "../userInputManager.js";

export let ChatMessages = [];

export function AddChatMessage(Session, Message) {
  ChatMessages.push(Message);
  if (ChatMessages.length > 50) {
    ChatMessages.shift();
  }
  let MessagesDiv = document.getElementById("Messages");
  MessagesDiv.innerHTML = "";
  for (let Msg of ChatMessages) {
    let MsgSpan = document.createElement("span");
    MsgSpan.style.color = "white";
    MsgSpan.innerHTML = `<b style="color: hsl(${Session.Plr.Hue}, 100%, 50%)">${Session.Plr.Name}:</b> ${Msg}<br>`;
    MessagesDiv.appendChild(MsgSpan);
  }
}

export function SentChatMessage(Message) {
  ThisSession.CallServer("SendChatMessage", { Message: Message });
}

AddOnSceneChangeListener("Game", () => {
  ClearScene("Game");

  let MainBox = new BoundingBox(-1000, -1000, 2000, 2000);
  AddObject("Game", MainBox);

  let Plr = ThisSession.Plr;
  Plr.IsClientControlled = true;
  Plr.BoundingBox = MainBox;
  Plr.Id = ThisSession.Id;
  Plr.X = Math.random() * 500 - 250;
  Plr.Y = Math.random() * 500 - 250;
  Camera.X = Plr.X;
  Camera.Y = Plr.Y;
  AddObject("Game", Plr);
});

AddOnSceneChangeListener("", () => {
  if (GameState.CurrentScene != "Game")
    document.getElementById("Chat").style.display = "none";
  else
    document.getElementById("Chat").style.display = "block";
});