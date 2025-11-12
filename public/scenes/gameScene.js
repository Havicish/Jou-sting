import { AddObject, RemoveObject, SetScene, CreateNewScene, ClearScene, Scenes, AddOnSceneChangeListener } from "../sceneManager.js"
import { AddUpdater } from "../updaters.js"
import { GameState } from "../main.js";
import { SetCookie, GetCookie } from "../cookiesManager.js";
import { ThisSession } from "../networking.js";
import { Player } from "../classes/player.js";
import { BoundingBox } from "../classes/boundingBox.js";

AddOnSceneChangeListener("Game", () => {
  ClearScene("Game");

  let MainBox = new BoundingBox(-1000, -1000, 2000, 2000);
  AddObject("Game", MainBox);

  let Plr = ThisSession.Plr;
  Plr.BoundingBox = MainBox;
  AddObject("Game", Plr);
});