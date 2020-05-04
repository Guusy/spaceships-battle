class Powerup {

    constructor(type) {
        this.type = type
        this.isActive = false
    }

    static render(game, powerupInfo) {
        if (game.powerup) game.powerup.destroy();
        game.powerup = game.physics.add.image(powerupInfo.x, powerupInfo.y, powerupInfo.icon);
        game.powerup.setData('type', powerupInfo.type)
        game.powerup.setTint(0x737373)
        setTimeout(() => {
            game.powerup.clearTint()
            game.physics.add.overlap(game.player.ship,
                game.powerup,
                (_, powerup) => game.player.collectPowerup(powerup));
        }, 3000)
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
        if (this.icon) {
            this.icon.destroy()
        }
        this.doDestroy()
    }

    activateInEnemy() {
        throw new Error("Method not implemented.");
    }

    renderIcon(game) {
        const icon = this.getIcon();
        this.icon = game.add.image(game.cameras.main.width - 80, 60, icon)
    }

    getIcon() {
        throw new Error("Method not implemented.");
    }

    doDestroy() {
        throw new Error("Method not implemented.");
    }

}

window.Powerup = Powerup
class AngularLaser extends Powerup {

    constructor() {
        super('AngularLaser')
        this.ttl = 10000
    }

    getIcon() {
        return 'angularLaser'
    }

    init() { }
    update() { }
    activateInEnemy() { }
    doDestroy() {
        this.restoreShoot()
    }

    activate(game, player) {
        this.isActive = true
        this.bkpShoot = player.shoot
        this.player = player
        // Laser modification
        setTimeout(() => {
            this.restoreShoot()
            this.player.checkPowerUpADestroy()
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

    restoreShoot() {
        if (this.bkpShoot && this.player) {
            this.player.shoot = this.bkpShoot
        }
    }
}

class ShieldWithTime extends Powerup {

    constructor() {
        super('ShieldWithTime')
        this.ttl = 3000
    }

    getIcon() {
        return 'shieldWithTime'
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
            player.checkPowerUpADestroy()
        }, this.ttl)

        player.hitByEnemyLaser = (laser) => { laser.destroy() }
        player.hitByMeteor = (meteor) => { meteor.destroy() }

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
        this.update(game, enemyPlayer)
        setTimeout(() => {
            this.destroy()
        }, this.ttl)
    }

    update(game, player) {
        const { x, y } = player.ship
        this.display.x = x
        this.display.y = y
    }

    doDestroy() {
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