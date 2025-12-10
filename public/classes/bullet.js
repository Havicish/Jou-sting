import { Ctx } from "../canvasManager.js";
import { ThisSession } from "../networking.js";
import { GetAllObjectsInScene, RemoveObject } from "../sceneManager.js";

export class Bullet {
  constructor() {
    this.X = 0;
    this.Y = 0;
    this.OwnerId = 0;
    this.InitSpeed = 1000;
    this.VelX = 0;
    this.VelY = 0;
    this.Rot = 0;
    this.Id = 0;
    this.TimeAlive = 0;
    this.WaveX;
    this.WaveY;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.TimeAlive += DT;

    if (this.X < -1000 || this.X > 1000 || this.Y < -1000 || this.Y > 1000) {
      for (let Obj of GetAllObjectsInScene("Game")) {
        if (Obj == this) {
          RemoveObject("Game", Obj);
          break;
        }
      }
    }
  }

  Render() {
    if (this.X < -1000 || this.X > 1000 || this.Y < -1000 || this.Y > 1000)
      return;
    
    Ctx.beginPath();
    if (this.OwnerId != ThisSession.Plr.Id)
      if (this.TimeAlive < 0.3)
        Ctx.fillStyle = "#ff0";
      else
        Ctx.fillStyle = "#f00";
    else
      if (this.TimeAlive < 0.3)
        Ctx.fillStyle = "#ff0";
      else
        Ctx.fillStyle = "#0f0";
    Ctx.arc(this.X, this.Y, 5, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.closePath();

    if (this.TimeAlive > 0.3 && !this.WaveX && !this.WaveY) {
      this.WaveX = this.X;
      this.WaveY = this.Y;
    }

    if (this.WaveX && this.WaveY) {
      let WaveSize = (this.TimeAlive - 0.3) * 200;
      Ctx.beginPath();
      Ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (WaveSize / 50)})`;
      Ctx.lineWidth = 8;
      Ctx.arc(this.WaveX, this.WaveY, WaveSize, 0, Math.PI * 2);
      Ctx.stroke();
      Ctx.closePath();
    }
  }
}