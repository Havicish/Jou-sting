import { GameState } from "./main.js";
import { HideCanvas, ShowCanvas } from "./canvasManager.js";

export let Scenes = {
  "MainMenu": { Objects: [], Type: "Html" } // Type can be Html or Canvas
};

export let OnSceneChangeListeners = {};

function Get(Selector) {
  return document.querySelector(Selector);
}

/** @param {string} Scene - The name of the scene. */
export function AddObject(Scene, Object) {
  Scenes[Scene].Objects.push(Object);
  Object.Scene = Scene;
}

/** @param {string} Scene - The name of the scene. */
export function RemoveObject(Scene, Object) {
  Scenes[Scene].Objects = Scenes[Scene].Objects.filter(obj => obj !== Object);
  Object.Scene = null;
}

/** @param {string} Scene - The name of the scene. */
export function SetScene(Scene) {
  let LastScene = GameState.CurrentScene;
  if (GameState.CurrentScene === Scene) return;
  GameState.CurrentScene = Scene;
  for (let Listener of OnSceneChangeListeners[Scene] || []) {
    Listener.Callback();
  }
  for (let Listener of OnSceneChangeListeners[""] || []) {
    Listener.Callback();
  }
  if (Scenes[Scene].Type === "Html") {
    HideCanvas();
    let HtmlElement = Get(`#HtmlScene${Scene}`);
    if (HtmlElement) {
      HtmlElement.style.display = "block";
    }
  } else {
    ShowCanvas();
    let LastHtmlElement = Get(`#HtmlScene${LastScene}`);
    if (LastHtmlElement) {
      LastHtmlElement.style.display = "none";
    }
  }
}

/** @param {String} Scene */
export function ResetScene(Scene) {
  for (let Listener of OnSceneChangeListeners[Scene] || []) {
    Listener.Callback();
  }
}

/** @param {string} Scene - The name of the scene. */
export function CreateNewScene(Scene) {
  if (Scenes[Scene] == null) {
    Scenes[Scene] = { Objects: [], Type: "Canvas" };
  }
}

/** @param {string} Scene - The name of the scene. */
export function ClearScene(Scene) {
  for (let Object of Scenes[Scene].Objects) {
    if (Object.OnClear) {
      Object.OnClear();
    }
  }
  Scenes[Scene].Objects = [];
}

/** @param {string} Scene - The name of the scene. */
export function AddOnSceneChangeListener(Scene, Callback) {
  if (OnSceneChangeListeners[Scene] == null) {
    OnSceneChangeListeners[Scene] = [];
  }
  OnSceneChangeListeners[Scene].push({ Scene, Callback });
  return OnSceneChangeListeners[Scene][OnSceneChangeListeners[Scene].length - 1];
}

/** @param {string} Scene - The name of the scene. */
export function RemoveOnSceneChangeListener(Scene, Listener) {
  OnSceneChangeListeners[Scene] = OnSceneChangeListeners[Scene].filter(l => l !== Listener);
}

/** @param {string} Scene - The name of the scene. */
export function GetAllObjectsInScene(Scene) {
  return Scenes[Scene].Objects;
}