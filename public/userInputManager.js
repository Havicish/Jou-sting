import { MainConsole } from "./consoleManager.js";
import { AddUpdater } from "./updaters.js";
import { SentChatMessage } from "./scenes/gameScene.js";

export let Mouse = {X: 0, Y: 0, Buttons: [], ScrollX: 0, ScrollY: 0};

document.addEventListener("mousemove", (Event) => {
  Mouse.X = Event.clientX;
  Mouse.Y = Event.clientY;
});

document.addEventListener("mousedown", (Event) => {
  Mouse.Buttons[Event.button] = true;
});

document.addEventListener("mouseup", (Event) => {
  Mouse.Buttons[Event.button] = false;
});

document.addEventListener("wheel", (Event) => {
  Mouse.ScrollX = Event.deltaX;
  Mouse.ScrollY = Event.deltaY;
  //Event.preventDefault();
}, { passive: false });

document.addEventListener("contextmenu", (Event) => {
  Event.preventDefault();
});

let Keys = [];
let KeysInChat = [];

document.addEventListener("keydown", (Event) => {
  let IsInChat = (document.getElementById("ChatInput") == document.activeElement);
  if (IsInChat) {
    KeysInChat.push(Event.key.toLowerCase());
    if (Event.key === "Enter") {
      Keys = [];
      for (let KeyInChat of KeysInChat) {
        Keys.push(KeyInChat);
      }
      KeysInChat = [];
      document.getElementById("ChatInput").blur();
      if (document.getElementById("ChatInput").value != "")
        SentChatMessage(document.getElementById("ChatInput").value);
      document.getElementById("ChatInput").value = "";
    }
    return;
  } else if (Event.key === "Enter") {
    document.getElementById("ChatInput").focus();
  }
  if (Keys.indexOf(Event.key.toLowerCase()) == -1) {
    Keys.push(Event.key.toLowerCase());
  }
});

document.addEventListener("keyup", (Event) => {
  let IsInChat = (document.getElementById("ChatInput") == document.activeElement);
  if (Event.key === "Enter" && IsInChat) {
    Keys = Keys.filter(key => key != "enter");
    return;
  }
  if (IsInChat) {
    const IndexInChat = KeysInChat.indexOf(Event.key.toLowerCase());
    if (IndexInChat > -1) {
      KeysInChat.splice(IndexInChat, 1);
    }
    return;
  }
  Keys = Keys.filter(key => key != Event.key.toLowerCase());
});

export function IsKeyDown(Key) {
  return Keys.indexOf(Key.toLowerCase()) > -1;
}