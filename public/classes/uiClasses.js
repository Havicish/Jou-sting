// All Xs and Ys are from 0-1 range, 0 being left/top, 1 being right/bottom

import { Canvas, Ctx } from '../canvasManager.js';
import { Mouse } from '../userInputManager.js';
import { GameState } from '../main.js';
import { Camera } from '../render.js';

let CachedImgs = [];

export class ImageButton {
  constructor(X, Y, Width, Height, ImageSrc, HoverImageSrc, AspectRatio, ZIndex = 0, OnClick) {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
    this.Image = new Image();
    this.Image.src = ImageSrc;
    this.HoverImage = new Image();
    this.HoverImage.src = HoverImageSrc;
    this.AspectRatio = AspectRatio; // 1Width:XHeight
    this.DisplayImage = this.Image;
    this.ZIndex = ZIndex;
    this.OnClick = OnClick;
    this.Scene = null;
    this.ImgsLoaded = 0;
    this.CanClick = true;
    this.OnClear = () => {
      document.removeEventListener("mousedown", this.HandleClick);
      this.Scene = null;
    };

    this.Image.addEventListener("load", () => {
      this.ImgsLoaded += 1;
    });

    this.HoverImage.addEventListener("load", () => {
      this.ImgsLoaded += 1;
    });

    this.HandleClick = (Event) => {
      if (GameState.CurrentScene != this.Scene) return;

      const MouseX = Event.clientX;
      const MouseY = Event.clientY;
      // Calculate the offset so zooming is centered on the camera's center
      const centerX = Canvas.width / 2;
      const centerY = Canvas.height / 2;

      const drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
      const drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;
      const drawWidth = this.Width * Canvas.width * Camera.Zoom;
      const drawHeight = this.Height * Canvas.height * Camera.Zoom;

      if (
        MouseX >= drawX &&
        MouseX <= drawX + drawWidth &&
        MouseY >= drawY &&
        MouseY <= drawY + drawHeight &&
        this.CanClick
      ) {
        this.OnClick();
      }
    };

    document.addEventListener("mousedown", this.HandleClick);
  }

  Update() {
    const MouseX = Mouse.X;
    const MouseY = Mouse.Y;
    // Calculate the offset so zooming is centered on the camera's center
    const centerX = Canvas.width / 2;
    const centerY = Canvas.height / 2;

    const drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
    const drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;
    const drawWidth = this.Width * Canvas.width * Camera.Zoom;
    const drawHeight = this.Height * Canvas.height * Camera.Zoom;

    if (
      MouseX >= drawX &&
      MouseX <= drawX + drawWidth &&
      MouseY >= drawY &&
      MouseY <= drawY + drawHeight &&
      this.CanClick
    ) {
      this.DisplayImage = this.HoverImage;
    } else {
      this.DisplayImage = this.Image;
    }
  }

  Render(Camera) {
    if (this.ImgsLoaded < 2) return;

    // Calculate the offset so zooming is centered on the camera's center
    const centerX = Canvas.width / 2;
    const centerY = Canvas.height / 2;

    const drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
    const drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;
    const drawWidth = this.Width * Canvas.width * Camera.Zoom;
    const drawHeight = this.Height * Canvas.height * Camera.Zoom;

    // Maintain aspect ratio if specified
    let finalWidth = drawWidth;
    let finalHeight = drawHeight;
    if (this.AspectRatio && this.AspectRatio > 0) {
      // AspectRatio is width:height (e.g., 1.5 means width is 1.5x height)
      if (drawWidth / drawHeight > this.AspectRatio) {
      finalWidth = drawHeight * this.AspectRatio;
      finalHeight = drawHeight;
      } else {
      finalHeight = drawWidth / this.AspectRatio;
      finalWidth = drawWidth;
      }
      // Center the image within the button area
      const offsetX = drawX + (drawWidth - finalWidth) / 2;
      const offsetY = drawY + (drawHeight - finalHeight) / 2;
      Ctx.drawImage(this.DisplayImage, offsetX, offsetY, finalWidth, finalHeight);
    } else {
      Ctx.drawImage(this.DisplayImage, drawX, drawY, drawWidth, drawHeight);
    }
  }
}

export class Img {
  constructor(X, Y, Width, Height, ImageSrc, AspectRatio, ZIndex = 0) {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
    this.Image = new Image();
    this.Image.src = ImageSrc;
    this.AspectRatio = AspectRatio; // 1Width:XHeight
    this.ZIndex = ZIndex;
    this.DisplayImage = this.Image;
    this.Loaded = false;

    this.Image.addEventListener("load", () => {
      this.Loaded = true;
      CachedImgs.push(ImageSrc);
    });
  }

  SetImage(ImageSrc) {
    this.Image = new Image();
    this.Image.src = ImageSrc;
    if (CachedImgs.indexOf(ImageSrc) == -1) {
      this.Loaded = false;
      this.Image.addEventListener("load", () => {
        this.Loaded = true;
      });
      CachedImgs.push(ImageSrc);
    }
    this.DisplayImage = this.Image;
  }

  Render(Camera) {
    if (!this.Loaded) return;

    // Calculate the offset so zooming is centered on the camera's center
    const centerX = Canvas.width / 2;
    const centerY = Canvas.height / 2;

    const drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
    const drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;
    const drawWidth = this.Width * Canvas.width * Camera.Zoom;
    const drawHeight = this.Height * Canvas.height * Camera.Zoom;

    // Maintain aspect ratio if specified
    let finalWidth = drawWidth;
    let finalHeight = drawHeight;
    if (this.AspectRatio && this.AspectRatio > 0) {
      // AspectRatio is width:height (e.g., 1.5 means width is 1.5x height)
      if (drawWidth / drawHeight > this.AspectRatio) {
      finalWidth = drawHeight * this.AspectRatio;
      finalHeight = drawHeight;
      } else {
      finalHeight = drawWidth / this.AspectRatio;
      finalWidth = drawWidth;
      }
      // Center the image within the button area
      const offsetX = drawX + (drawWidth - finalWidth) / 2;
      const offsetY = drawY + (drawHeight - finalHeight) / 2;
      Ctx.drawImage(this.DisplayImage, offsetX, offsetY, finalWidth, finalHeight);
    } else {
      Ctx.drawImage(this.DisplayImage, drawX, drawY, drawWidth, drawHeight);
    }
  }
}

export class Text {
  constructor(X, Y, Width, Height, Text, Color = "white", ZIndex = 0, Align = "center") {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
    this.Text = Text;
    this.Color = Color;
    this.ZIndex = ZIndex;
    this.Align = Align; // "left", "center", "right"
  }

  Render(Camera) {
    const centerX = Canvas.width / 2;
    const centerY = Canvas.height / 2;

    const drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
    const drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;
    const drawWidth = this.Width * Canvas.width * Camera.Zoom;
    const drawHeight = this.Height * Canvas.height * Camera.Zoom;

    let fontSize = this.Height * Camera.Zoom * innerHeight;
    Ctx.font = `bold ${fontSize}px 'Silkscreen', monospace`;
    Ctx.fillStyle = this.Color;
    Ctx.textAlign = this.Align;
    Ctx.textBaseline = "middle";

    let measuredWidth = Ctx.measureText(this.Text).width;
    const maxWidth = this.Width * innerWidth * Camera.Zoom;
    if (measuredWidth > maxWidth) {
      fontSize *= maxWidth / measuredWidth;
      Ctx.font = `bold ${fontSize}px 'Silkscreen', monospace`;
    }

    Ctx.strokeStyle = "black";
    Ctx.lineWidth = 8;
    Ctx.strokeText(this.Text, drawX, drawY);
    Ctx.fillText(this.Text, drawX, drawY);
  }
}

export class InputBox {
  constructor(X, Y, Width, Height, Placeholder = "", ZIndex = 0, Align = "center", OnChange = null) {
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;
    this.Placeholder = Placeholder;
    this.ZIndex = ZIndex;
    this.OnChange = OnChange;
    this.Text = "e";
    this.LastText = "";
    this.Align = Align; // "left", "center", "right"
    this.Color = "white";
    // The box should be invisible but should still be interactable
    this.Box = document.createElement("input");
    this.Box.type = "text";
    this.Box.placeholder = "";
    this.Box.style.position = "absolute";
    this.Box.style.zIndex = 2;
    this.Box.style.fontFamily = "monospace";
    this.Box.style.fontSize = "1px";
    this.Box.style.backgroundColor = "rgba(0, 0, 0, 0)";
    this.Box.style.color = "rgba(0, 0, 0, 0)";
    this.Box.style.border = "0px";
    this.Box.style.outline = "0px";
    this.Box.style.resize = "none";
    this.Box.style.padding = "0px";
    this.Box.style.margin = "0px";
    this.Box.style.width = "0px";
    this.Box.style.height = "0px";
    this.Box.autocomplete = "off";
    this.Box.spellcheck = false;
    this.Box.maxLength = 128;
    //this.Box.value = "";
    document.body.appendChild(this.Box);

    this.OnClear = () => {
      document.body.removeChild(this.Box);
      this.Scene = null;
    };
  }

  Update() {
    this.Box.style.left = (innerWidth * (this.X - this.Width / 2)) + "px";
    this.Box.style.top = (innerHeight * (this.Y - this.Height / 2)) + "px";
    this.Box.style.width = (innerWidth * this.Width) + "px";
    this.Box.style.height = (innerHeight * this.Height) + "px";
    if (this.Box.value.length < 128) {
      this.Text = this.Box.value;
    } else {
      this.Text = this.Box.value.substring(0, 128);
      this.Box.value = this.Text;
    }

    if (this.OnChange && this.Text !== this.LastText) {
      this.OnChange(this.Text);
    }
    this.LastText = this.Text;

    if (this.Box.value == "" && document.activeElement != this.Box) {
      this.Text = this.Placeholder;
      this.Color = "gray";
    } else {
      this.Color = "white";
    }
  }

  Render(Camera) {
    // Calculate the offset so zooming is centered on the camera's center
    const centerX = Canvas.width / 2;
    const centerY = Canvas.height / 2;

    let drawX = centerX + ((this.X - Camera.X) * Canvas.width - centerX) * Camera.Zoom;
    let drawY = centerY + ((this.Y - Camera.Y) * Canvas.height - centerY) * Camera.Zoom;

    let fontSize = this.Height * Camera.Zoom * innerHeight;
    Ctx.font = `bold ${fontSize}px 'Silkscreen', monospace`;
    Ctx.fillStyle = this.Color;
    Ctx.textAlign = this.Align;
    Ctx.textBaseline = "middle";

    let measuredWidth = Ctx.measureText(this.Text).width;
    const maxWidth = this.Width * innerWidth * Camera.Zoom;
    if (measuredWidth > maxWidth) {
      fontSize *= maxWidth / measuredWidth;
      Ctx.font = `bold ${fontSize}px 'Silkscreen', monospace`;
    }

    if (this.Align == "left") {
      drawX -= (this.Width * Camera.Zoom * innerWidth) / 2;
    } else if (this.Align == "right") {
      drawX += (this.Width * Camera.Zoom * innerWidth) / 2;
    }

    Ctx.strokeStyle = "black";
    Ctx.lineWidth = 8;
    Ctx.strokeText(this.Text, drawX, drawY);
    Ctx.fillText(this.Text, drawX, drawY);
  }
}