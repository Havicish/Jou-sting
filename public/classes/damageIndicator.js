import { Ctx } from "../canvasManager.js";

export class DamageIndicator {
  constructor(X, Y, Amount) {
    this.X = X;
    this.Y = Y;
    let RandRot = Math.random() * Math.PI * 2;
    this.VelX = Math.cos(RandRot) * 50;
    this.VelY = Math.sin(RandRot) * 50;
    this.Amount = Amount;
    this.LifeTime = 2;
  }

  Update(DT) {
    this.LifeTime -= DT;
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;
    this.VelX /= Math.pow(1.01, DT * 60);
    this.VelY /= Math.pow(1.01, DT * 60);
    this.VelY += DT * 15;
  }

  Render() {
    if (this.Amount > 0) {
      Ctx.strokeStyle = `rgba(0, 255, 0, ${this.LifeTime / 2})`;
    } else {
      Ctx.strokeStyle = `rgba(255, 0, 0, ${this.LifeTime / 2})`;
    }
    Ctx.fillStyle = `rgba(0, 0, 0, ${this.LifeTime / 2})`;
    Ctx.font = "bold 20px Arial";
    Ctx.textAlign = "center";
    Ctx.lineWidth = 4;
    Ctx.strokeText(this.Amount, this.X, this.Y);
    Ctx.fillText(this.Amount, this.X, this.Y);
  }
}