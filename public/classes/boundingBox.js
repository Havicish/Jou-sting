import { Ctx } from "../canvasManager.js";

export class BoundingBox {
  constructor(X, Y, Width, Height) {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
    this.Color = "#fff";
    this.DotCount = 30;
    this.DotColor = "rgba(255, 255, 255, 0.5)";
  }

  Update(DT) {
    // Pass
  }

  Render() {
    Ctx.beginPath();
    Ctx.strokeStyle = this.Color;
    Ctx.lineWidth = 2;
    Ctx.strokeRect(this.X, this.Y, this.Width, this.Height);

    for (let X = 1; X <= this.DotCount - 1; X++) {
      for (let Y = 1; Y <= this.DotCount - 1; Y++) {
        let DotX = this.X + (X / this.DotCount) * this.Width;
        let DotY = this.Y + (Y / this.DotCount) * this.Height;
        Ctx.beginPath();
        Ctx.arc(DotX, DotY, 2, 0, Math.PI * 2);
        Ctx.fillStyle = this.DotColor;
        Ctx.fill();
      }
    }
  }
}