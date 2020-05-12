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
        const { x, y } = playerInfo
        this.createAccelerationParticles()
        this.ship = this.game.physics.add.sprite(x, y, this.getSprite())
            .setOrigin(0.5, 0.5)
            .setDisplaySize(53, 40);
        this.ship.setCollideWorldBounds(true)
        this.ship.setTint(0x737373)
        this.ship.setDrag(100);
        this.ship.setAngularDrag(100);
        this.ship.body.setMaxSpeed(300);        
        const hpPosition = this._calculateHpPosition(x, y)
        const displayPosition = this._calculateDisplayPosition(x, y)
        this.hp = new HealthBar(this.game, hpPosition.x, hpPosition.y);
        // this.dash = new HealthBar(game);
        this.displayName = this.game.add.text(displayPosition.x, displayPosition.y, this.data.playerName)

        this.doRender(playerInfo)

        setTimeout(() => {
            this.ship.clearTint()
            this.ship.setTint(`0x${playerInfo.color}`)
            this.removeSpawnProtection()
        }, 2500)
        this.emitter.startFollow(this.ship);
    }

    createAccelerationParticles() {
        this.particles = this.game.add.particles('space');
        this.emitter = this.particles.createEmitter({
            frame: 'blue',
            speed: 100,
            lifespan: {
                onEmit: () => Phaser.Math.Percent(this.ship.body.acceleration.length(), 0, 1500) * 500 * 3
            },
            alpha: {
                onEmit: () => Phaser.Math.Percent(this.ship.body.acceleration.length(), 0, 500)
            },
            angle: {
                onEmit: () => (this.ship.angle - 90) + Phaser.Math.Between(-10, 10)
            },
            scaleX: {
                onEmit: (particle) => particle.initialScale = Phaser.Math.Percent(this.ship.body.acceleration.length(), 0, 1500),
                onUpdate: ({initialScale}, _name, life) => initialScale * (1 - life)
            },
            scaleY: {
                onEmit: ({initialScale}) => initialScale,
                onUpdate: ({initialScale}, _name, life) => initialScale * (1 - life)
            },
            blendMode: 'ADD',
            x: {
                onEmit: () => 20 * Math.cos((this.ship.angle - 90) * Math.PI / 180)
            },
            y: {
                onEmit: () =>  20 * Math.sin((this.ship.angle - 90) * Math.PI / 180)
            },
        });
    }

    revive(playerInfo) {
        this.data = { ...this.data, ...playerInfo }
        this.render(playerInfo)
    }

    update(time, delta) {
        this.doUpdate(time, delta)
        this.updateShipLayout()
        this.updatePowerup()
    }

    isMe(name) {
        return this.data.playerName === name
    }

    updateHp(newHp) {
        this.hp.value = newHp
        this.hp.draw()
    }

    updatePowerup() {
        if (this.powerup && this.powerup.isActive) {
            this.powerup.update(this.game, this)
        }
    }

    _calculateHpPosition(x, y) {
        return {
            x: x - 37,
            y: y + 30
        }
    }

    _calculateDisplayPosition(x, y) {
        return {
            x: x - 30,
            y: y - 40
        }
    }

    updateShipLayout() {
        const { x, y } = this.ship
        const hpPosition = this._calculateHpPosition(x, y)
        const displayPosition = this._calculateDisplayPosition(x, y)
        this.displayName.x = displayPosition.x
        this.displayName.y = displayPosition.y
        this.hp.x = hpPosition.x
        this.hp.y = hpPosition.y
        // this.dash.x = this.hp.x
        // this.dash.y = this.hp.y + 5
        // this.dash.draw()
        this.hp.draw()
    }

    destroy() {
        const animation = this.game.physics.add.sprite(this.ship.x, this.ship.y, this.getSprite())
        this.emitter.stop()
        this.ship.destroy()
        this.displayName.destroy()
        this.hp.destroy()
        this.checkPowerUpADestroy()
        animation.setTexture('sprExplosion')
        animation.setScale(2.5, 2.5)
        animation.play('sprExplosion')
        animation.on('animationcomplete', () => {
            if (animation) {
                animation.destroy()
            }
        })
    }

    checkPowerUpADestroy() {
        if (this.powerup) {
            this.powerup.destroy(this.game, this)
            this.powerup = null
        }
    }

    get playerName(){
        return this.data.playerName
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