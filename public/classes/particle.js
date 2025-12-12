import { Ctx } from "../canvasManager.js";
import { GetAllObjectsInScene } from "../sceneManager.js";

export class Particle {
  constructor() {
    this.X = 0;
    this.Y = 0;
    let RandRot = Math.random() * Math.PI * 2;
    this.VelX = Math.cos(RandRot) * 50;
    this.VelY = Math.sin(RandRot) * 50;
    this.LifeTime = 1;
    this.Color = "#fff";
    this.Size = 2;
    this.Drag = 1.01;
    this.Gravity = 15;
    this.StartFade = 1;
    this.BoundingBox = null;

    for (let Obj of GetAllObjectsInScene("Game")) {
      if (Obj.constructor.name == "BoundingBox") {
        this.BoundingBox = Obj;
      }
    }
  }

  SetRandomVelocity(Power) {
    let RandRot = Math.random() * Math.PI * 2;
    this.VelX = Math.cos(RandRot) * Power;
    this.VelY = Math.sin(RandRot) * Power;
  }

  Update(DT) {
    this.LifeTime -= DT;
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;
    this.VelX /= Math.pow(this.Drag, DT * 60);
    this.VelY /= Math.pow(this.Drag, DT * 60);
    this.VelY += DT * this.Gravity;
  }

  ShouldRemove() {
    return this.LifeTime <= 0;
  }

  Render() {
    if (this.X < this.BoundingBox.X ||
        this.X > this.BoundingBox.X + this.BoundingBox.Width ||
        this.Y < this.BoundingBox.Y ||
        this.Y > this.BoundingBox.Y + this.BoundingBox.Height) {
      return;
    }
    Ctx.beginPath();
    Ctx.fillStyle = this.Color;
    Ctx.save();
    Ctx.globalAlpha = Math.min(Math.max((this.LifeTime), 0), 1);
    Ctx.arc(this.X, this.Y, this.Size, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.restore();
  }
}