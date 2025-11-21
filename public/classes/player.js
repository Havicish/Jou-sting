import { Ctx } from "../canvasManager.js";
import { IsKeyDown } from "../userInputManager.js";
import { Camera } from "../render.js";
import { AddOnSceneChangeListener, GetAllObjectsInScene } from "../sceneManager.js";
import { MainConsole } from "../consoleManager.js";
import { ThisSession } from "../networking.js";

let MoveCooldowns = {
  "Dash": 3,
  "BackDash": 2,
  "QuickSpin": 0.25,
  "Teleport": 6,
  "Shoot": 2.5,
  "Caltrop": 3.5,
  "Emp": 5
};

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
    this.MaxHealth = 100;
    this.Move1 = document.getElementById("Move1Select").value;
    this.Move2 = document.getElementById("Move2Select").value;
    this.Move1CD = 0;
    this.Move2CD = 0;
    this.MaxMove1CD = MoveCooldowns[this.Move1];
    this.MaxMove2CD = MoveCooldowns[this.Move2];
    this.Speed = 1400;
    this.Drag = 1.06;
    this.TurnSpeed = 6.5;
    this.LanceLength = 60;
    this.BoundingBox = null;
    this.StabbingCD = 0;
    this.Hue = 0;
    this.DeadTime = 0;
    this.LastHitBy = null;
    this.ZIndex = 100;

    this.PropsToSmoothTo = {};
    this.GeneralSmoothingFactor = 1;
    this.SpecificSmoothingFactors = { "Rot": 0.5, "X": 0.25, "Y": 0.25, "VelX": 0.25, "VelY": 0.25 };

    this.IsClientControlled = false;

    AddOnSceneChangeListener("Game", () => {
      this.Move1 = document.getElementById("Move1Select").value;
      this.Move2 = document.getElementById("Move2Select").value;
      this.MaxMove1CD = MoveCooldowns[this.Move1];
      this.MaxMove2CD = MoveCooldowns[this.Move2];
      MainConsole.Log(`Move 1 set to ${this.Move1} || Move 2 set to ${this.Move2}`);
    });
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

      if (IsKeyDown("K") && this.Move1CD <= 0) {
        this.UseMove1();
      }
      if (IsKeyDown("L") && this.Move2CD <= 0) {
        this.UseMove2();
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

    //if (this.IsClientControlled)
      //Camera.Zoom = 1 + (1000 - Math.min(1000, Math.hypot(this.VelX, this.VelY))) / 3000;

    Camera.Zoom = 0.9;

    this.Move1CD -= DT;
    this.Move2CD -= DT;
    this.Move1CD = Math.max(0, this.Move1CD);
    this.Move2CD = Math.max(0, this.Move2CD);

    for (let Key of Object.keys(this.PropsToSmoothTo)) {
      let Smoothing = this.GeneralSmoothingFactor;

      if (Object.hasOwn(this.SpecificSmoothingFactors, Key))
        Smoothing = this.SpecificSmoothingFactors[Key];

      this[Key] += (this.PropsToSmoothTo[Key] - this[Key]) * Smoothing * DT * 60
    }
  }

  Render() {
    if (this.DeadTime > 0) {
      if (Camera.Tracking == this) {
        let LastHitBy;

        for (let Obj of GetAllObjectsInScene("Game")) {
          if (Obj.Id == this.LastHitBy) {
            LastHitBy = Obj;
          }
        }

        Camera.Tracking = LastHitBy;
      }

      if (this.IsClientControlled)
        this.RenderDead();

      return;
    } else {
      if (this.IsClientControlled)
        Camera.Tracking = this;
    };

    let Color = `hsl(${this.Hue}, 100%, ${(this.Health / this.MaxHealth) * 50 + 50}%)`;
    let Color40Percent = `hsla(${this.Hue}, 100%, ${(this.Health / this.MaxHealth) * 50 + 50}%, 0.4)`;
    let Color20Percent = `hsla(${this.Hue}, 100%, ${(this.Health / this.MaxHealth) * 50 + 50}%, 0.2)`;

    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 10, 0, Math.PI * 2);
    Ctx.fillStyle = Color;
    Ctx.fill();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, 0, Math.PI * 2);
    Ctx.strokeStyle = Color20Percent;
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, this.Rot, this.Rot + Math.PI * (1 - (this.Move2CD / this.MaxMove2CD)));
    Ctx.strokeStyle = Color40Percent;
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, 22, this.Rot - (Math.PI * (1 - (this.Move1CD / this.MaxMove1CD))), this.Rot);
    Ctx.strokeStyle = Color40Percent;
    Ctx.lineWidth = 8;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.moveTo(this.X + Math.cos(this.Rot) * 10, this.Y + Math.sin(this.Rot) * 10);
    Ctx.lineTo(this.X + Math.cos(this.Rot) * this.LanceLength, this.Y + Math.sin(this.Rot) * this.LanceLength);
    Ctx.strokeStyle = Color;
    Ctx.lineWidth = 1.5;
    Ctx.stroke();
    Ctx.beginPath();
    Ctx.fillStyle = "#fff";
    Ctx.textAlign = "center";
    Ctx.save();
    Ctx.translate(this.X, this.Y);
    Ctx.rotate(-Camera.Rot);
    if (Camera.TrackRot)
      Ctx.fillText(this.Name, 0, 34);
    else
      Ctx.fillText(this.Name, 0, -28);
    Ctx.restore();
  }

  RenderDead() {
    Ctx.save();
    Ctx.fillStyle = "#fff";
    Ctx.textAlign = "center";
    Ctx.font = "48px Arial";
    Ctx.fillText("You Died! Respawning in " + Math.ceil(this.DeadTime) + "s",  Camera.X, Camera.Y);
    Ctx.restore();
  }

  UpdateProps(Props) {
    for (let Prop in Props) {
      this[Prop] = Props[Prop]
    }
  }

  UseMove1() {
    if (this.Move1 == "Dash") {
      this.VelX = Math.cos(this.Rot) * 1500;
      this.VelY = Math.sin(this.Rot) * 1500;
    }
    if (this.Move1 == "BackDash") {
      this.VelX = Math.cos(this.Rot) * -2250;
      this.VelY = Math.sin(this.Rot) * -2250;
    }
    if (this.Move1 == "QuickSpin") {
      this.Rot += Math.PI;
    }
    if (this.Move1 == "Teleport") {
      this.X += Math.cos(this.Rot) * 400;
      this.Y += Math.sin(this.Rot) * 400;
      this.VelX = 0;
      this.VelY = 0;
    }
    if (this.Move1 == "Shoot") {
      ThisSession.CallServer("PlayerShoot", { }, () => {
        this.Move1CD = MoveCooldowns["Shoot"];
      });
    }
    if (this.Move1 == "Caltrop") {
      ThisSession.CallServer("PlayerCaltrop", { }, () => {
        this.Move1CD = MoveCooldowns["Caltrop"];
      });
    }
    if (this.Move1 == "Emp") {
      ThisSession.CallServer("PlayerEmp", { }, () => {
        this.Move1CD = MoveCooldowns["Emp"];
      });
    }
    this.Move1CD = MoveCooldowns[this.Move1];
  }

  UseMove2() {
    if (this.Move2 == "Dash") {
      this.VelX = Math.cos(this.Rot) * 1500;
      this.VelY = Math.sin(this.Rot) * 1500;
    }
    if (this.Move2 == "BackDash") {
      this.VelX = Math.cos(this.Rot) * -2250;
      this.VelY = Math.sin(this.Rot) * -2250;
    }
    if (this.Move2 == "QuickSpin") {
      this.Rot += Math.PI;
    }
    if (this.Move2 == "Teleport") {
      this.X += Math.cos(this.Rot) * 400;
      this.Y += Math.sin(this.Rot) * 400;
      this.VelX = 0;
      this.VelY = 0;
    }
    if (this.Move2 == "Shoot") {
      ThisSession.CallServer("PlayerShoot", { }, () => {
        this.Move2CD = MoveCooldowns["Shoot"];
      });
    }
    if (this.Move2 == "Caltrop") {
      ThisSession.CallServer("PlayerCaltrop", { }, () => {
        this.Move2CD = MoveCooldowns["Caltrop"];
      });
    }
    this.Move2CD = MoveCooldowns[this.Move2];
  }
}