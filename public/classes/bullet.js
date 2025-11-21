import { Ctx } from "../canvasManager.js";
import { ThisSession } from "../networking.js";
import { GetAllObjectsInScene, RemoveObject } from "../sceneManager.js";

export class Bullet {
  constructor(X, Y, Rot, OwnerId, Id) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.InitSpeed = 1000;
    this.VelX = Math.cos(Rot) * this.InitSpeed;
    this.VelY = Math.sin(Rot) * this.InitSpeed;
    this.Rot = Rot;
    this.Id = Id;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

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
      Ctx.fillStyle = "#f00";
    else
      Ctx.fillStyle = "#0f0";
    Ctx.arc(this.X, this.Y, 5, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.closePath();
  }
}