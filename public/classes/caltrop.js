import { Ctx } from "../canvasManager.js";
import { ThisSession } from "../networking.js";

export class Caltrop {
  constructor(X, Y, OwnerId, Id) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.Id = Id;
    this.VelX = 0;
    this.VelY = 0;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    if (this.X < -1000 || this.X > 1000)
      this.VelX *= -1;

    if (this.Y < -1000 || this.Y > 1000)
      this.VelY *= -1;
  }

  Render() {
    let Alpha = (Caltrop.LifeTime / 10) * 0.75 + 0.25;
    let Color = (Caltrop.OwnerId == ThisSession.Id)
      ? `rgba(127,255,127,${Alpha})`
      : `rgba(255,127,127,${Alpha})`;

    Ctx.save();
    Ctx.translate(this.X, this.Y);
    Ctx.strokeStyle = Color;

    for (let i = 0; i < 6; i++) {
      let Angle = i * Math.PI / 3;
      Ctx.beginPath();
      Ctx.moveTo(0, 0);
      Ctx.lineTo(Math.cos(Angle) * 24, Math.sin(Angle) * 24);
      Ctx.lineWidth = 3;
      Ctx.stroke();
    }

    Ctx.restore();
  }
}