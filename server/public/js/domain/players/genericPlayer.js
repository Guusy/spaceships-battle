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
        // this.hp = new HealthBar(game);
        // this.dash = new HealthBar(game);
        this.displayName = this.game.add.text(this.ship.x - 30, this.ship.y - 40, this.data.playerName)
        this.doRender(playerInfo)
        setTimeout(() => {
            this.ship.clearTint()
            this.ship.setTint(`0x${playerInfo.color}`)
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
        // this.hp.x = x - 37
        // this.hp.y = y + 30
        // this.dash.x = this.hp.x
        // this.dash.y = this.hp.y + 5
        // this.dash.draw()
        // this.hp.draw()
    }

    destroy() {
        const animation = this.game.physics.add.sprite(this.ship.x, this.ship.y, 'ship')
        this.ship.destroy()
        this.displayName.destroy()
        // this.hp.destroy()
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

// eslint-disable-next-line no-unused-vars
class HealthBar {

    constructor(scene, x, y) {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;
        this.value = 100;
        this.p = 76 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease(amount) {
        this.value -= amount;

        if (this.value < 0) {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw() {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 70, 3);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 70, 3);

        if (this.value < 30) {
            this.bar.fillStyle(0xff0000);
        } else {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 3);
    }

    destroy() {
        this.bar.destroy()
    }

}