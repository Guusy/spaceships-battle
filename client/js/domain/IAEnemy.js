

window.IAEnemy = class Meteor {

    static render(game, { id, x, y, scale, velocity }) {

        const IA = game.physics.add.sprite(x, y, 'ship')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(53, 40);
        IA.setCollideWorldBounds(true)
        IA.setTint(0xff0000)
        IA.setDrag(100);
        IA.setAngularDrag(100);
        IA.body.setMaxSpeed(300);


        // this.emitter.startFollow(IA);
    }
}