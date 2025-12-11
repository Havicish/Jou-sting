import { RenderAll } from "./render.js";
import { UpdateAll } from "./updaters.js";
import { Scenes, SetScene } from "./sceneManager.js";
import { Mouse } from "./userInputManager.js";
import { ThisSession } from "./networking.js";
import { MainConsole } from "./consoleManager.js";

export let GameState = {
  CurrentScene: null,
  LastScene: null,
  TimeScale: 1,
};

document.addEventListener("DOMContentLoaded", () => {
  SetScene("MainMenu");

  Frame();
});

let LastTime = performance.now();
function Frame() {
  let DT = (performance.now() - LastTime) / 1000;
  LastTime = performance.now();
  DT = Math.min(DT, 0.1) * GameState.TimeScale;

  let Objects = Scenes[GameState.CurrentScene].Objects;

  let ShouldRemove = [];
  for (let Object of Objects) {
    if (Object.Update) {
      Object.Update(DT);
      if (typeof Object.ShouldRemove == "function" && Object.ShouldRemove())
        ShouldRemove.push(Object);
    }
  }

  for (let Object of ShouldRemove) {
    Objects.splice(Objects.indexOf(Object), 1);
  }

  UpdateAll(DT);

  RenderAll(Objects);

  Mouse.ScrollX /= 1.1;
  Mouse.ScrollY /= 1.1;

  GameState.LastScene = GameState.CurrentScene;

  GameState.IsInitialStart = false;

  requestAnimationFrame(Frame);
}