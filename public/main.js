import { RenderAll } from "./render.js";
import { UpdateAll } from "./updaters.js";
import { Scenes, SetScene } from "./sceneManager.js";
import { Mouse } from "./userInputManager.js";

export let GameState = {
  CurrentScene: null,
  LastScene: null
};

document.addEventListener("DOMContentLoaded", () => {
  SetScene("MainMenu");

  Frame();
});

let LastTime = performance.now();
function Frame() {
  let DT = (performance.now() - LastTime) * (60/1000);
  LastTime = performance.now();

  let Objects = Scenes[GameState.CurrentScene.Objects];

  for (let Object of Objects) {
    if (Object.Update) {
      Object.Update(DT);
    }
  }

  UpdateAll(DT);

  RenderAll(Objects);

  Mouse.ScrollX /= 1.1;
  Mouse.ScrollY /= 1.1;

  GameState.LastScene = GameState.CurrentScene;

  GameState.IsInitialStart = false;

  requestAnimationFrame(Frame);
}