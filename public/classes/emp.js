import { GetAllObjectsInScene, RemoveObject } from "../sceneManager.js";
import { Ctx } from "../canvasManager.js";

// Electro-Magnetic Pulse
export class Emp {
  constructor() {
    this.X = 0;
    this.Y = 0;
    this.Size = 40;
    this.Id;
  }

  Update(DT) {
    this.Size += DT * 100;

    if (this.Size >= 140) {
      for (let Obj of GetAllObjectsInScene("Game")) {
        if (Obj.Id == this.Id) {
          RemoveObject("Game", Obj);
        }
      }
    }
  }

  Render() {
    Ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, this.Size, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    Ctx.stroke();
  }
}