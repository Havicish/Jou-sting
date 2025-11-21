import { Ctx } from "../canvasManager.js";
import { MainConsole } from "../consoleManager.js";
import { ThisSession } from "../networking.js";
import { RemoveObject } from "../sceneManager.js";

export class Caltrop {
  constructor() {
    this.X = 0;
    this.Y = 0;
    this.OwnerId = 0;
    this.Id = 0;
    this.VelX = 0;
    this.VelY = 0;
    this.LifeTime = 10;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.LifeTime -= DT;
    if (this.LifeTime <= 0) {
      RemoveObject("Game", this);
      return;
    }

    if (this.X < -1000 || this.X > 1000)
      this.VelX *= -1;

    if (this.Y < -1000 || this.Y > 1000)
      this.VelY *= -1;
  }

  Render() {
    let Alpha = (this.LifeTime / 10) * 0.75 + 0.25;
    let Color = (this.OwnerId == ThisSession.Id)
      ? `rgba(127,255,127,${Alpha})`
      : `rgba(255,127,127,${Alpha})`;

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

    Ctx.translate(-this.X, -this.Y);
  }
}