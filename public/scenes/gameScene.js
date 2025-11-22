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

export function AddChatMessage(Name, Hue, Message) {
  ChatMessages.push({ Name, Hue, Message });
  if (ChatMessages.length > 50) {
    ChatMessages.shift();
  }
  
  let MessagesDiv = document.getElementById("Messages");
  
  // Check if user was at bottom BEFORE modifying the content
  let WasAtBottom = MessagesDiv && (MessagesDiv.scrollHeight - MessagesDiv.scrollTop - MessagesDiv.clientHeight <= 5);
  
  // Clear and rebuild messages
  MessagesDiv.innerHTML = "";
  for (let Msg of ChatMessages) {
    let MsgSpan = document.createElement("span");
    MsgSpan.style.color = "white";
    if (Msg.Hue)
      MsgSpan.innerHTML = `<b style="color: hsl(${Msg.Hue}, 100%, 50%)">${Msg.Name}:</b> ${Msg.Message}<br>`;
    else
      MsgSpan.innerHTML = `<b style="color: rgb(192, 192, 192)">${Msg.Name}:</b> ${Msg.Message}<br>`;
    MessagesDiv.appendChild(MsgSpan);
  }
  
  // Scroll to bottom if user was at bottom before the update
  if (WasAtBottom) {
    MessagesDiv.scrollTop = MessagesDiv.scrollHeight;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("ChatSend").addEventListener("click", () => {
    document.getElementById("ChatInput").blur();
    if (document.getElementById("ChatInput").value != "")
      SentChatMessage(document.getElementById("ChatInput").value);
    document.getElementById("ChatInput").value = "";
    document.getElementById("ChatInput").blur();
  });

  document.getElementById("ChatToggleDisplay").addEventListener("click", () => {
    if (document.getElementById("ChatToggleDisplay").innerHTML == "Hide") {
      document.getElementById("ChatToggleDisplay").innerHTML = "Show";
      document.getElementById("Messages").style.display = "none";
      document.getElementById("Chat").style.height = "30px";
    } else {
      document.getElementById("ChatToggleDisplay").innerHTML = "Hide";
      document.getElementById("Messages").style.display = "block";
      document.getElementById("Chat").style.height = "150px";
    }
    document.getElementById("ChatToggleDisplay").blur();
  });
});

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

  let MessagesDiv = document.getElementById("Messages");
  setTimeout(() => {
    MessagesDiv.scrollTop = MessagesDiv.scrollHeight;
  }, 5);
});

AddOnSceneChangeListener("", () => {
  if (GameState.CurrentScene != "Game") {
    document.getElementById("Chat").style.display = "none";
    document.getElementById("FPSDisplay").style.display = "none";
  } else {
    document.getElementById("Chat").style.display = "block";
    document.getElementById("FPSDisplay").style.display = "block";
  }
});

let Deltas = [];
AddUpdater((DT) => {
  Deltas.push(DT);

  if (Deltas.length > 60) {
    Deltas.shift();
  }

  let TotalDelta = 0;
  for (let Delta of Deltas) {
    TotalDelta += Delta;
  }
  TotalDelta /= Deltas.length
  TotalDelta = 1 / TotalDelta;

  document.getElementById("FPSDisplay").innerHTML = `FPS: ${Math.round(TotalDelta)}`;
});