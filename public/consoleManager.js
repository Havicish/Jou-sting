import { AddUpdater } from "./updaters.js";
import { IsKeyDown } from "./userInputManager.js";

class Console {
  constructor() {
    this.Visible = false;
    this.ToggleKey = "`";
    this.PauseKey = "Escape";
    this.LastToggleKeyDown = false;
    this.LastPauseKeyDown = false;
    this.TotalMessages = 0;
    this.MaxMessages = 200;
    this.IsPaused = false;

    this.Log("Console initialized.");
  }

  Update() {
    let IsToggleKeyDown = IsKeyDown(this.ToggleKey);

    if (IsToggleKeyDown && !this.LastToggleKeyDown) {
      this.Visible = !this.Visible;

      if (this.Visible)
        document.getElementById("Console").style.display = "block";
      else
        document.getElementById("Console").style.display = "none";
    }

    this.LastToggleKeyDown = IsToggleKeyDown;

    if (IsKeyDown(this.PauseKey) && !this.LastPauseKeyDown) {
      this.IsPaused = !this.IsPaused;
    }

    this.LastPauseKeyDown = IsKeyDown(this.PauseKey);
  }

  Log(Msg) {
    if (this.IsPaused) return;

    let ConsoleEle = document.getElementById("Console");
    const line = document.createElement('div');
    line.style.color = "#fff";
    line.textContent = Msg;
    ConsoleEle.appendChild(line);
    ConsoleEle.scrollTop = ConsoleEle.scrollHeight;
    
    this.TotalMessages += 1;
    if (this.TotalMessages > this.MaxMessages) {
      ConsoleEle.removeChild(ConsoleEle.firstChild);
      this.TotalMessages = this.MaxMessages;
    }
  }

  Warn(Msg) {
    if (this.IsPaused) return;

    let ConsoleEle = document.getElementById("Console");
    const line = document.createElement('div');
    line.style.color = "#ff0";
    line.textContent = Msg;
    ConsoleEle.appendChild(line);
    ConsoleEle.scrollTop = ConsoleEle.scrollHeight;
    
    this.TotalMessages += 1;
    if (this.TotalMessages > this.MaxMessages) {
      ConsoleEle.removeChild(ConsoleEle.firstChild);
      this.TotalMessages = this.MaxMessages;
    }
  }

  Error(Msg) {
    if (this.IsPaused) return;

    let ConsoleEle = document.getElementById("Console");
    const line = document.createElement('div');
    line.style.color = "#f00";
    line.textContent = Msg;
    ConsoleEle.appendChild(line);
    ConsoleEle.scrollTop = ConsoleEle.scrollHeight;
    
    this.TotalMessages += 1;
    if (this.TotalMessages > this.MaxMessages) {
      ConsoleEle.removeChild(ConsoleEle.firstChild);
      this.TotalMessages = this.MaxMessages;
    }
  }
}

export let MainConsole = new Console();

document.addEventListener("error", (event) => {
  MainConsole.Error(event.message + " at " + event.filename + ":" + event.lineno + ":" + event.colno);
});

AddUpdater(() => MainConsole.Update());