import { Ctx } from "../canvasManager.js";

export class ChatMessageParticle {
  constructor(X, Y, Text, Color) {
    this.X = X;
    this.Y = Y;
    let RandRot = Math.random() * Math.PI * 2;
    this.VelX = Math.cos(RandRot) * 50;
    this.VelY = Math.sin(RandRot) * 50;
    this.Text = Text;
    this.LifeTime = 5;
    for (let i = 0; i < Text.length; i++) {
      if (Text.charAt(i) == " ") {
        this.LifeTime += 0.5;
      }
    }
    this.Color = Color;
  }

  Update(DT) {
    this.LifeTime -= DT;
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;
    this.VelX /= Math.pow(1.01, DT * 60);
    this.VelY /= Math.pow(1.01, DT * 60);
    this.VelY += DT * 15;
  }

  ShouldRemove() {
    return this.LifeTime <= 0;
  }

  Render() {
    Ctx.strokeStyle = this.Color;
    Ctx.fillStyle = "#000";
    Ctx.font = "bold 20px Arial";
    Ctx.textAlign = "center";
    Ctx.lineWidth = 4;
    Ctx.save();
    Ctx.globalAlpha = Math.min(this.LifeTime, 1);
    Ctx.strokeText(this.Text, this.X, this.Y);
    Ctx.fillText(this.Text, this.X, this.Y);
    Ctx.restore();
  }
}