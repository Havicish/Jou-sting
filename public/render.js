import { Canvas, Ctx} from './canvasManager.js';

export let Camera = {X: 0, Y: 0, Zoom: 1};

export function RenderAll(Objects) {
  Ctx.clearRect(0, 0, Canvas.width, Canvas.height);

  let SortedObjects = Objects.slice().sort((a, b) => (a.ZIndex || 0) - (b.ZIndex || 0));

  for (let Object of SortedObjects) {
    if (Object.Render) {
      Object.Render(Camera);
    }
  }
}