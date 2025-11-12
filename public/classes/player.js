import { Ctx } from "../canvasManager";
import { IsKeyDown } from "../userInputManager.js";
import { ThisSession } from "../networking.js";

export class Player {
  constructor() {
    this.Name = "";
    this.X = 0;
    this.Y = 0;
    this.VelX = 0;
    this.VelY = 0;
    this.Rot = 0;
    this.VelRot = 0;
    this.Health = 100;

    this.IsClientControlled = false;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.VelX /= ((1.02 - 1) * DT);
    this.VelY /= ((1.02 - 1) * DT);

    this.Rot += this.VelRot * DT;

    if (this.IsClientControlled) {
      if (IsKeyDown("W")) {
        console.log();
      }
    }
  }

  Render() {
    Ctx.arc(this.X, this.Y, 10, 0, Math.PI * 2);
    Ctx.fillStyle = "#fff";
    Ctx.fill();
  }

  UpdateProps(Props) {
    for (let Prop in Props) {
      this[Prop] = Props[Prop]
    }
  }
}