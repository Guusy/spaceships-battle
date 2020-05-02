// TODO: use a generic class between this class and Player.js
window.EnemyPlayer = class EnemyPlayer extends GenericPlayer {

    constructor(game, playerInfo) {
        super(game, playerInfo)
    }

    doUpdate(){}

    getSprite(){
        return 'otherPlayer'
    }

    doRender() {
        this.game.otherPlayers.add(this.ship);
    }

    removeSpawnProtection(){
        this.game.physics.add.overlap(this.ship, this.game.lasers, (_, object) => this.somethingHitsMe(object), null, this.game)
        // TODO: there is a bug with the first user of lobby
        this.game.physics.add.overlap(this.ship, this.game.meteors, (_, object) => this.somethingHitsMe(object), null, this.game)
    }

    updateMovement(newInfo) {
        this.ship.setRotation(newInfo.rotation);
        this.ship.setPosition(newInfo.x, newInfo.y);
        this.update()
    }

    activatePowerup() {
        this.powerup.activateInEnemy(this.game, this)
    }

    somethingHitsMe(object) {
        // TODO: decide which one has the source of the true, the enemy or you
        object.destroy()
    }

}