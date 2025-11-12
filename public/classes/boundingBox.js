import { Ctx } from "../canvasManager.js";

export class BoundingBox {
  constructor(X, Y, Width, Height) {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
  }

  Update(DT) {
    // Pass
  }

  Render() {
    Ctx.beginPath();
    Ctx.strokeStyle = "#ff0000";
    Ctx.lineWidth = 2;
    Ctx.strokeRect(this.X, this.Y, this.Width, this.Height);
  }
}