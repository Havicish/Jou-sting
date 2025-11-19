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

// Declare variables at module level
let Move1Select, Move2Select, Move1Desc, Move2Desc, TotalPlrCountElement, NameInput, CharacterColorInput;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  Move1Select = document.getElementById("Move1Select");
  Move2Select = document.getElementById("Move2Select");
  Move1Desc = document.getElementById("Move1Desc");
  Move2Desc = document.getElementById("Move2Desc");
  TotalPlrCountElement = document.getElementById("TotalPlrCount");
  NameInput = document.getElementById("NameInput");
  CharacterColorInput = document.getElementById("CharacterColor");

  let Move1 = GetCookie("Move1");
  let Move2 = GetCookie("Move2");
  let Name = GetCookie("Name");
  let CharacterColor = GetCookie("CharacterColor");

  Move1Select.value = Move1 || "Dash";
  Move2Select.value = Move2 || "Dash";
  NameInput.value = Name || `Plr${Math.round(Math.random() * 1000)}`;
  CharacterColorInput.value = CharacterColor || "0";
  CharacterColorInput.style.setProperty('--thumb-color', `hsl(${CharacterColorInput.value}, 100%, 50%)`);

  Move1Desc.innerHTML = `<i>${Descriptions[Move1 || "Dash"]}</i>`;
  Move2Desc.innerHTML = `<i>${Descriptions[Move2 || "Dash"]}</i>`;

  Move1Select.addEventListener("change", function() {
    Move1Desc.innerHTML = `<i>${Descriptions[this.value]}</i>`;
    SetCookie("Move1", this.value);
  });

  Move2Select.addEventListener("change", function() {
    Move2Desc.innerHTML = `<i>${Descriptions[this.value]}</i>`;
    SetCookie("Move2", this.value);
  });

  CharacterColorInput.addEventListener("change", function() {
    SetCookie("CharacterColor", this.value);
  });

  document.getElementById("JoinGame").addEventListener("click", () => {
    try {
      CreateNewScene("Game");
      ThisSession.Plr.Name = document.getElementById("NameInput").value || "Unnamed";
      ThisSession.Plr.Hue = document.getElementById("CharacterColor").value || 0;
      ThisSession.CallServer("JoinGame", { GameName: document.getElementById("GameName").value }, (Response) => {
        ThisSession.GameName = Response.GameName;
        SetScene("Game");
      });
    } catch (e) {
      alert("Failed to join game: " + e);
    }
  });

  NameInput.addEventListener("input", function() {
    SetCookie("Name", this.value);
  });
});

let TimeUntilNewUpdate = 0;
let TotalPlrCount;
AddUpdater((DT) => {
  TimeUntilNewUpdate -= DT;
  if (TimeUntilNewUpdate > 0 || !ShouldUpdateTotalPlrCount)
    return;

  ThisSession.CallServer("GetTotalPlrCount", {}, (Response) => {
    TotalPlrCount = Response.TotalPlrCount;
  });
  if (ShouldUpdateTotalPlrCount && TotalPlrCount && TotalPlrCountElement) {
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