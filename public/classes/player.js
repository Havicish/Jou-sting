import { Ctx } from "../canvasManager.js";
import { IsKeyDown } from "../userInputManager.js";
import { Camera } from "../render.js";
import { ThisSession } from "../networking.js";

export class Player {
  constructor() {
    this.Id = null;
    this.Name = "";
    this.X = 0;
    this.Y = 0;
    this.VelX = 0;
    this.VelY = 0;
    this.Rot = 0;
    this.VelRot = 0;
    this.Health = 100;
    this.Move1CD = 3;
    this.Move2CD = 0;
    this.MaxMove1CD = 3;
    this.MaxMove2CD = 3;
    this.Speed = 1400;
    this.Drag = 1.06;
    this.TurnSpeed = 6.5;
    this.LanceLength = 60;
    this.BoundingBox = null;

    this.IsClientControlled = false;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.VelX /= Math.pow(this.Drag, DT * 60);
    this.VelY /= Math.pow(this.Drag, DT * 60);

    this.Rot += this.VelRot * DT;
    this.VelRot = 0;

    if (this.IsClientControlled) {
      if (IsKeyDown("W")) {
        this.VelX += Math.cos(this.Rot) * this.Speed * DT;
        this.VelY += Math.sin(this.Rot) * this.Speed * DT;
      }
      if (IsKeyDown("A")) {
        this.VelRot -= this.TurnSpeed;
      }
      if (IsKeyDown("D")) {
        this.VelRot += this.TurnSpeed;
      }
    }

    if (this.BoundingBox) {
      if (this.X < this.BoundingBox.X) {
        this.X = this.BoundingBox.X;
        this.VelX *= -1;
      }
      if (this.X > this.BoundingBox.X + this.BoundingBox.Width) {
        this.X = this.BoundingBox.X + this.BoundingBox.Width;
        this.VelX *= -1;
      }
      if (this.Y < this.BoundingBox.Y) {
        this.Y = this.BoundingBox.Y;
        this.VelY *= -1;
      }
      if (this.Y > this.BoundingBox.Y + this.BoundingBox.Height) {
        this.Y = this.BoundingBox.Y + this.BoundingBox.Height;
        this.VelY *= -1;
      }
    }

    this.Move1CD -= DT;
    this.Move2CD -= DT;
    this.Move1CD = Math.max(0, this.Move1CD);
    this.Move2CD = Math.max(0, this.Move2CD);
  }

  Render() {
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 10, 0, Math.PI * 2);
    Ctx.fillStyle = "#fff";
    Ctx.fill();
    Ctx.beginPath();
    Ctx.moveTo(this.X, this.Y);
    Ctx.lineTo(this.X + Math.cos(this.Rot) * this.LanceLength, this.Y + Math.sin(this.Rot) * this.LanceLength);
    Ctx.strokeStyle = "#fff";
    Ctx.lineWidth = 1.5;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, 0, Math.PI * 2);
    Ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, this.Rot, this.Rot + Math.PI * (1 - (this.Move2CD / this.MaxMove2CD)));
    Ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, this.Rot - (Math.PI * (1 - (this.Move1CD / this.MaxMove1CD))), this.Rot);
    Ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.fillStyle = "#fff";
    Ctx.textAlign = "center";
    Ctx.fillText(this.Id, this.X, this.Y - 16);
  }

  UpdateProps(Props) {
    for (let Prop in Props) {
      this[Prop] = Props[Prop]
    }
  }
}