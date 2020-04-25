class PowerUp {

    constructor(type) {
        this.type = type
        this.isActive = false
    }

    init() {
        throw new Error("Method not implemented.");
    }

    activate() {
        throw new Error("Method not implemented.");
    }

    update() {
        throw new Error("Method not implemented.");
    }

    destroy() {
        throw new Error("Method not implemented.");
    }

    activateInEnemy() {
        throw new Error("Method not implemented.");
    }

}

class AngularLaser extends PowerUp {

    constructor() {
        super('AngularLaser')
        this.ttl = 10000
    }

    init() { }
    update() { }
    destroy() { }
    activateInEnemy() { }

    activate(game, player) {
        this.isActive = true
        const bkpShoot = player.shoot

        // Laser modification
        setTimeout(() => {
            player.shoot = bkpShoot
            player.powerup = null
        }, this.ttl)

        player.shoot = () => {
            const { x, y, rotation } = player.ship
            const { color } = player.data
            const renderColor = `0x${color}`
            const baseProperties = {
                color: renderColor,
                x,
                y,
                ...player.connectionCredentials()
            }
            const lasers = [
                {
                    ...baseProperties,
                    id: game.generateRandomId(),
                    rotation: rotation + 100
                },
                {
                    ...baseProperties,
                    id: game.generateRandomId(),
                    rotation: rotation
                },
                {
                    ...baseProperties,
                    id: game.generateRandomId(),
                    rotation: rotation - 100
                }
            ]
            game.renderLaser(game.lasers, lasers[0])
            game.renderLaser(game.lasers, lasers[1])
            game.renderLaser(game.lasers, lasers[2])

            game.socket.emit('shoot', { room: baseProperties.room, lasers });
        }

    }
}

class ShieldWithTime extends PowerUp {

    constructor() {
        super('ShieldWithTime')
        this.ttl = 3000
    }

    init() { }

    activate(game, player) {
        this.isActive = true
        // Now we need to modify the hit of the meteor and laser by a nop
        const hitByEnemyLaserBKP = player.hitByEnemyLaser
        const hitByMeteorBKP = player.hitByMeteor

        setTimeout(() => {
            player.hitByEnemyLaser = hitByEnemyLaserBKP
            player.hitByMeteor = hitByMeteorBKP
            player.checkPowerUpADestroy(game)
        }, this.ttl)

        player.hitByEnemyLaser = (game, laser) => { laser.destroy() }
        player.hitByMeteor = (game, meteor) => { meteor.destroy() }

        this._createCircle(game)
    }

    _createCircle(game) {
        const graphics = game.add.graphics({
            lineStyle: {
                width: 2,
                color: 0xadadaa
            }
        });

        this.display = graphics.strokeCircleShape(
            new Phaser.Geom.Circle(null, null, 35)
        );
    }

    activateInEnemy(game, enemyPlayer) {
        this.isActive = true
        this._createCircle(game)
        this.update(game, { ship: enemyPlayer })
        setTimeout(() => {
            this.destroy()
        }, this.ttl)
    }

    update(game, player) {
        const { x, y } = player.ship
        this.display.x = x
        this.display.y = y
    }

    destroy() {
        if (this.isActive) {
            this.isActive = false
            this.display.destroy()
        }
    }
}

window.powerups = {
    AngularLaser,
    ShieldWithTime,
}