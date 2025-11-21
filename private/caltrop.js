class Caltrop {
  constructor(X, Y, OwnerId) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.VelX = 0;
    this.VelY = 0;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    if (this.X < -1000 || this.X > 1000)
      this.VelX *= -1;

    if (this.Y < -1000 || this.Y > 1000)
      this.VelY *= -1;
  }
}

module.exports = { Caltrop };