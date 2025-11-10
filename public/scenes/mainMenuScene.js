import { Img, ImageButton, Text, InputBox } from "../classes/uiClasses.js"
import { AddObject, RemoveObject, SetScene, CreateNewScene, ClearScene, Scenes } from "../sceneManager.js"
import { AddUpdater } from "../updaters.js"
import { GameState } from "../main.js";
import { AddOnSceneChangeListener } from "../sceneManager.js";
import { Camera } from "../render.js";

let IsInitialStart = true;

AddOnSceneChangeListener("MainMenu", () => {
  ClearScene("MainMenu");

  Camera.Zoom = 1;

  IsInitialStart = false;
});