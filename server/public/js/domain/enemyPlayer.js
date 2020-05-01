// TODO: use a generic class between this class and Player.js
window.EnemyPlayer = class EnemyPlayer {

    constructor(game, playerInfo) {
        this.game = game
        this.data = {
            ...playerInfo,
            room: this.game.room
        }
        this._render(playerInfo)
    }

    _render(playerInfo) {
        this.ship = this.game.physics.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(53, 40);
        this.ship.setCollideWorldBounds(true)
        this.ship.setTint(0x737373)
        this.game.otherPlayers.add(this.ship);

        this.displayName = this.game.add.text(this.ship.x - 30, this.ship.y - 40, this.data.playerName)// creo texto

        setTimeout(() => {
            this.ship.setTint(`0x${playerInfo.color}`);
            this.game.physics.add.overlap(this.ship, this.game.lasers, (_, object) => this.somethingHitsMe(object), null, this.game)
            // TODO: there is a bug with the first user of lobby
            this.game.physics.add.overlap(this.ship, this.game.meteors, (_, object) => this.somethingHitsMe(object), null, this.game)
        }, 2500)
    }

    revive(playerInfo) {
        this.data = { ...this.data, ...playerInfo }
        this._render(playerInfo)
    }

    updateMovement(newInfo) {
        this.ship.setRotation(newInfo.rotation);
        this.ship.setPosition(newInfo.x, newInfo.y);
        this.displayName.x = this.ship.x - 30
        this.displayName.y = this.ship.y - 40
        if (this.powerup && this.powerup.isActive) {
            this.powerup.update(this.game, this)
        }
    }

    activatePowerup() {
        this.powerup.activateInEnemy(this.game, this)
    }

    somethingHitsMe(object) {
        // TODO: decide which one has the source of the true, the enemy or you
        object.destroy()
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

} 