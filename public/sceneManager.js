import { GameState } from "./main.js";

export let Scenes = {
  "MainMenu": { Objects: [], Type: "Html" }
};

export let OnSceneChangeListeners = {};

/** @param {string} Scene - The name of the scene. */
export function AddObject(Scene, Object) {
  Scenes[Scene].push(Object);
  Object.Scene = Scene;
}

/** @param {string} Scene - The name of the scene. */
export function RemoveObject(Scene, Object) {
  Scenes[Scene] = Scenes[Scene].filter(obj => obj !== Object);
  Object.Scene = null;
}

/** @param {string} Scene - The name of the scene. */
export function SetScene(Scene) {
  if (GameState.CurrentScene === Scene) return;
  GameState.CurrentScene = Scene;
  for (let Listener of OnSceneChangeListeners[Scene] || []) {
    Listener.Callback();
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
    Scenes[Scene] = [];
  }
}

/** @param {string} Scene - The name of the scene. */
export function ClearScene(Scene) {
  for (let Object of Scenes[Scene]) {
    if (Object.OnClear) {
      Object.OnClear();
    }
  }
  Scenes[Scene] = [];
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