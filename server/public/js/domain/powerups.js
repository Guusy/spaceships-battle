class PowerUp {

    init() {
        throw new Error("Method not implemented.");
    }

    activate() {
        throw new Error("Method not implemented.");
    }

}

class AngularLaser extends PowerUp {

    constructor() {
        super()
        this.ttl = 10000
    }

    init() { }

    activate(game, player) {
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

window.powerups = {
    AngularLaser,
}