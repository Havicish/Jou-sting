class Bullet {
  constructor(X, Y, Rot, OwnerId) {
    this.X = X;
    this.Y = Y;
    this.OwnerId = OwnerId;
    this.InitSpeed = 1000;
    this.VelX = Math.cos(Rot) * this.InitSpeed;
    this.VelY = Math.sin(Rot) * this.InitSpeed;
    this.Rot = Rot;
  }

  Update(DT) {
    this.X += this.VelX * DT;
    this.Y += this.VelY * DT;
  }
}

module.exports = { Bullet };