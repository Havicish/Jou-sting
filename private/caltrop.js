class Caltrop {
  constructor(X, Y, OwnerId) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.VelX = 0;
    this.VelY = 0;
    this.LifeTime = 10;
    this.ToRemove = false;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.LifeTime -= DT;
    if (this.LifeTime <= 0) {
      this.ToRemove = true;
      return;
    }

    if (this.X < -1000 || this.X > 1000)
      this.VelX *= -1;

    if (this.Y < -1000 || this.Y > 1000)
      this.VelY *= -1;
  }
}

module.exports = { Caltrop };