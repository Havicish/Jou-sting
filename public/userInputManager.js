import { AddUpdater } from "./updaters.js";

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
  Event.preventDefault();
}, { passive: false });

document.addEventListener("contextmenu", (Event) => {
  Event.preventDefault();
});

let Keys = [];

document.addEventListener("keydown", (Event) => {
  if (Keys.indexOf(Event.key.toLowerCase()) == -1) {
    Keys.push(Event.key.toLowerCase());
  }
});

document.addEventListener("keyup", (Event) => {
  const Index = Keys.indexOf(Event.key.toLowerCase());
  if (Index > -1) {
    Keys.splice(Index, 1);
  }
});

export function IsKeyDown(Key) {
  return Keys.indexOf(Key.toLowerCase()) > -1;
}