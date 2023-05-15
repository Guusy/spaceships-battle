class IAEnemy {
  constructor({ room }) {
    console.log("IAEnemy builded on the server");
    this.x = Math.floor(Math.random() * 700) + 50;
    this.y = Math.floor(Math.random() * 500) + 50;

    setInterval(() => {
      // TODO: move to a generic place to shoot lasers
      const user = room.getRandomUser();

      room.shootLaser({
        from: {
          x: this.x,
          y: this.y,
        },
        to: {
          x: user.x,
          y: user.y,
        },
        rotation: user.rotation,
      });

      console.log("turret shoot from the server");
    }, 1000);
  }
}

module.exports = IAEnemy;
