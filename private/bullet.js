class Bullet {
  constructor(X, Y, Rot, OwnerId) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.InitSpeed = 1000;
    this.VelX = Math.cos(Rot) * this.InitSpeed;
    this.VelY = Math.sin(Rot) * this.InitSpeed;
    this.Rot = Rot;
    this.Id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.TimeAlive = 0;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;

    this.TimeAlive += DT;

    if (this.X < -1000 || this.X > 1000 || this.Y < -1000 || this.Y > 1000)
      this.ToRemove = true;
  }
}

module.exports = { Bullet };