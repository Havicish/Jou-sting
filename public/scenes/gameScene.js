import { AddObject, RemoveObject, SetScene, CreateNewScene, ClearScene, Scenes } from "../sceneManager.js"
import { AddUpdater } from "../updaters.js"
import { GameState } from "../main.js";
import { AddOnSceneChangeListener } from "../sceneManager.js";
import { SetCookie, GetCookie } from "../cookiesManager.js";
import { ThisSession } from "../networking.js";

AddOnSceneChangeListener("Game", () => {
  ClearScene("Game");

  
});