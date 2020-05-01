window.GenericPlayer = class GenericPlayer {

    constructor(game, playerInfo) {
        this.game = game
        this.powerup;
        this.data = {
            ...playerInfo,
            room: this.game.room
        }
        this.render(playerInfo)
    }

    getSprite() {
        throw new Error("Method not implemented.");
    }

    doUpdate() {
        throw new Error("Method not implemented.");
    }

    doRender() {
        throw new Error("Method not implemented.");
    }

    removeSpawnProtection() {
        throw new Error("Method not implemented.");
    }

    activatePowerup() {
        throw new Error("Method not implemented.");
    }

    render(playerInfo) {
        this.ship = this.game.physics.add.sprite(playerInfo.x, playerInfo.y, this.getSprite())
            .setOrigin(0.5, 0.5)
            .setDisplaySize(53, 40);
        this.ship.setCollideWorldBounds(true)
        this.ship.setTint(0x737373)
        this.displayName = this.game.add.text(this.ship.x - 30, this.ship.y - 40, this.data.playerName)
        this.doRender(playerInfo)
        setTimeout(() => {
            this.removeSpawnProtection()
        }, 2500)
    }

    revive(playerInfo) {
        this.data = { ...this.data, ...playerInfo }
        this.render(playerInfo)
    }

    update() {
        this.doUpdate()
        this.updateShipLayout()
        this.updatePowerup()
    }

    updatePowerup() {
        if (this.powerup && this.powerup.isActive) {
            this.powerup.update(this.game, this)
        }
    }

    updateShipLayout() {
        this.displayName.x = this.ship.x - 30
        this.displayName.y = this.ship.y - 40
    }

    destroy() {
        const animation = this.game.physics.add.sprite(this.ship.x, this.ship.y, 'ship')
        this.ship.destroy()
        this.displayName.destroy()
        animation.setTexture('sprExplosion')
        animation.setScale(2.5, 2.5)
        animation.play('sprExplosion')
        animation.on('animationcomplete', () => {
            if (animation) {
                animation.destroy()
            }
        })
    }

    connectionCredentials() {
        return {
            playerId: this.data.playerId,
            playerName: this.data.playerName,
            room: this.data.room
        }
    }
}