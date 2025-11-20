import { Canvas, Ctx} from './canvasManager.js';
import { AddUpdater } from './updaters.js';

export let Camera = {X: 0, Y: 0, Zoom: 1, Rot: 0, Tracking: null, TrackingSpeed: 0.05, TrackRot: false};

export function RenderAll(Objects) {
  Ctx.clearRect(0, 0, Canvas.width, Canvas.height);

  let SortedObjects = Objects.slice().sort((a, b) => (a.ZIndex || 0) - (b.ZIndex || 0));

  Ctx.save();
  Ctx.translate(Canvas.width / 2, Canvas.height / 2);
  Ctx.scale(Camera.Zoom, Camera.Zoom);
  Ctx.rotate(Camera.Rot);
  Ctx.translate(-Camera.X, -Camera.Y);
  for (let Object of SortedObjects) {
    if (Object.Render) {
      Object.Render(Camera);
    }
  }
  Ctx.restore();
}

AddUpdater((DT) => {
  if (Camera.Tracking) {
    Camera.X += (Camera.Tracking.X - Camera.X) * Camera.TrackingSpeed * DT * 60;
    Camera.Y += (Camera.Tracking.Y - Camera.Y) * Camera.TrackingSpeed * DT * 60;
    if (Camera.TrackRot)
      Camera.Rot += ((-Camera.Tracking.Rot - Math.PI / 2) - Camera.Rot) * Camera.TrackingSpeed * DT * 60;
  }
});