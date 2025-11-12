import { AddObject, RemoveObject, SetScene, CreateNewScene, ClearScene, Scenes } from "../sceneManager.js"
import { AddUpdater } from "../updaters.js"
import { GameState } from "../main.js";
import { AddOnSceneChangeListener } from "../sceneManager.js";
import { SetCookie, GetCookie } from "../cookiesManager.js";
import { ThisSession } from "../networking.js";

let ShouldUpdateTotalPlrCount = true;

let Descriptions = {
  "Dash": "A simple dash. Cooldown: 3s",
  "BackDash": "A simple backwards dash. Cooldown: 2s",
  "QuickSpin": "An immediate 180 degree spin. No cooldown"
};

let Move1Select = document.getElementById("Move1Select");
let Move2Select = document.getElementById("Move2Select");
let Move1Desc = document.getElementById("Move1Desc");
let Move2Desc = document.getElementById("Move2Desc");
let TotalPlrCountElement = document.getElementById("TotalPlrCount");
let NameInput = document.getElementById("NameInput");

Move1Select.addEventListener("change", function() {
  Move1Desc.innerHTML = `<i>${Descriptions[this.value]}</i>`;
  SetCookie("Move1", this.value);
});

Move2Select.addEventListener("change", function() {
  Move2Desc.innerHTML = `<i>${Descriptions[this.value]}</i>`;
  SetCookie("Move2", this.value);
});

document.addEventListener("DOMContentLoaded", async () => {
  await new Promise(resolve => setTimeout(resolve, 20));

  let Move1 = GetCookie("Move1");
  let Move2 = GetCookie("Move2");
  let Name = GetCookie("Name");

  Move1Select.value = Move1 || "Dash";
  Move2Select.value = Move2 || "Dash";
  NameInput.value = Name || `Plr${Math.round(Math.random() * 1000) / 1000}`;

  Move1Desc.innerHTML = `<i>${Descriptions[Move1]}</i>`;
  Move2Desc.innerHTML = `<i>${Descriptions[Move2]}</i>`;
});

NameInput.addEventListener("input", function() {
  SetCookie("Name", this.value);
});

document.getElementById("JoinGame").addEventListener("click", () => {
  ThisSession.CallServer("JoinGame", { Id: ThisSession.Id, GameName: document.getElementById("GameName").value }, (Response) => {
    ThisSession.GameName = Response.GameName;
    CreateNewScene("Game");
    SetScene("Game");
  });
});

let TimeUntilNewUpdate = 0;
let TotalPlrCount;
AddUpdater((DT) => {
  TimeUntilNewUpdate -= DT;
  if (TimeUntilNewUpdate > 0)
    return;

  ThisSession.CallServer("GetTotalPlrCount", {}, (Response) => {
    console.log(Response.TotalPlrCount);
    TotalPlrCount = Response.TotalPlrCount;
  });
  if (ShouldUpdateTotalPlrCount && TotalPlrCount) {
    TotalPlrCountElement.innerHTML = `Current players: ${TotalPlrCount}`;
  }
  TimeUntilNewUpdate = 0.25;
});

AddOnSceneChangeListener("MainMenu", () => {
  ClearScene("MainMenu");
});

AddOnSceneChangeListener("", () => { // Update on any change
  if (GameState.CurrentScene == "MainMenu")
    ShouldUpdateTotalPlrCount = true;
  else
    ShouldUpdateTotalPlrCount = false;
});