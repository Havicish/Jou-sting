import { Ctx } from "../canvasManager.js";
import { ThisSession } from "../networking.js";

export class Bullet {
  constructor(X, Y, Rot, OwnerId) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.InitSpeed = 1000;
    this.VelX = Math.cos(Rot) * this.InitSpeed;
    this.VelY = Math.sin(Rot) * this.InitSpeed;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;
  }

  Render() {
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