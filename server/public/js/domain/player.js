window.Player = class Player {

    constructor(game, playerInfo) {
        this.powerup;
        this.cooldownDash = 5000
        this.canDash = true
        this.ship = game.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
        this.ship.setDrag(100);
        this.ship.setAngularDrag(100);
        this.ship.setMaxVelocity(200);
        this.ship.setCollideWorldBounds(true)
        this.ship.setTint(0x737373)
        // this.hp = new HealthBar(game);
        // this.dash = new HealthBar(game);

        if (game.star) {
            game.physics.add.overlap(this.ship, game.star, (_, star) => this.collectStar(game, star));
        }
        if (game.powerup) {
            game.physics.add.overlap(this.ship, game.powerup, (_, powerup) => this.collectPowerup(game, powerup));
        }

        this.data = {
            ...playerInfo,
            timerShootDelay: 30,
            timerShootTick: 29,
            canShoot: false,
            room: game.room
        }

        setInterval(() => {
            this.canDash = true
        }, this.cooldownDash)

        setTimeout(() => {
            this.ship.clearTint()
            this.ship.setTint(`0x${playerInfo.color}`)
            this.data.canShoot = true

            game.physics.add.overlap(this.ship, game.meteors, (_, meteor) => this.hitByMeteor(game, meteor))
            game.physics.add.overlap(this.ship, game.enemiesLasers, (_, enemyLaser) => this.hitByEnemyLaser(game, enemyLaser));
        }, 2500)
    }

    collectStar(game, star) {
        star.destroy()
        game.socket.emit('starCollected', this.connectionCredentials());
    }

    collectPowerup(game, powerup) {
        if (!this.powerup) {
            this.powerup = new powerups[powerup.getData('type')]()
            this.powerup.renderIcon(game)
            powerup.destroy()
            game.socket.emit('powerupCollected', { ...this.connectionCredentials(), powerup: this.powerup });
        }
    }

    hitByMeteor(game, meteor) {
        this.destroy(game)
        meteor.destroy()
        const credentials = this.connectionCredentials()
        game.socket.emit('killed', { killer: null, ...credentials })
    }

    checkPowerUpActivation(game) {
        if (this.powerup && !this.powerup.isActive) {
            game.socket.emit('powerupActivated', { ...this.connectionCredentials(), powerup: this.powerup })
            this.powerup.activate(game, this)
        }
    }

    checkPowerUpAUpdate(game) {
        if (this.powerup && this.powerup.isActive) {
            this.powerup.update(game, this)
        }
    }

    checkPowerUpADestroy(game) {
        if (this.powerup) {
            this.powerup.destroy(game, this)
            this.powerup = null
        }
    }

    dash(game) {
        if (this.canDash) {
            this.canDash = false
            game.physics.velocityFromRotation(this.ship.rotation + 1.5, 30000, this.ship.body.acceleration);
        }
    }

    // updateBars() {
    //     this.hp.x = x - 37
    //     this.hp.y = y + 30
    //     this.dash.x = this.hp.x
    //     this.dash.y = this.hp.y + 5
    //     this.dash.draw()
    //     this.hp.draw()
    // }

    update(game) {
        this.calculatePowerUp(game)
        this.calculateMovement(game)
        this.calculateShoot(game)
    }

    calculatePowerUp(game) {
        const { cursors } = game
        if (cursors.activatePowerup.isDown) {
            this.checkPowerUpActivation(game)
        }

        this.checkPowerUpAUpdate(game)
    }

    calculateMovement(game) {
        const { socket, cursors, physics } = game

        if (cursors.left.isDown) {
            this.ship.setAngularVelocity(-150);
        } else if (cursors.right.isDown) {
            this.ship.setAngularVelocity(150);
        } else {
            this.ship.setAngularVelocity(0);
        }

        if (cursors.up.isDown) {
            physics.velocityFromRotation(this.ship.rotation + 1.5, 500, this.ship.body.acceleration);
        } else {
            this.ship.setAcceleration(0);
        }

        if (cursors.dash.isDown && !cursors.up.isDown) {
            this.dash(game)
        }
        // this.updateBars();
        // emit player movement
        const { x, y, rotation } = this.ship
        const { oldPosition } = this.ship
        if (oldPosition &&
            (x !== oldPosition.x || y !== oldPosition.y || rotation !== oldPosition.rotation)) {
            socket.emit('playerMovement', { x, y, rotation, ...this.connectionCredentials() });
        }

        // save old position data
        this.ship.oldPosition = { x, y, rotation };
    }

    calculateShoot(game) {
        if (game.cursors.space.isDown && this.data.canShoot) {
            if (this.data.timerShootTick < this.data.timerShootDelay) {
                this.data.timerShootTick += 1
            } else {
                game.sound.play('laserSound');
                this.shoot(game)
                this.data.timerShootTick = 0
            }
        }
    }

    shoot(game) {
        const color = `0x${this.data.color}`
        const id = game.generateRandomId()
        this.renderLaser(game, { id, color })
        const { room, playerName } = this.connectionCredentials()
        game.socket.emit('shoot', {
            room,
            lasers: {
                id,
                x: this.ship.x,
                y: this.ship.y,
                rotation: this.ship.rotation,
                color,
                room,
                playerName
            }
        });
    }


    renderLaser(game, { id, color }) {
        const { x, y, rotation } = this.ship
        const { playerName } = this.data
        game.renderLaser(game.lasers, { id, color, x, y, rotation, playerName })
    }
    // TODO: Unify with hit by meteor
    hitByEnemyLaser(game, enemyLaser) {
        this.destroy(game)
        const credentials = this.connectionCredentials()
        game.socket.emit('killed', { killer: enemyLaser.getData('playerName'), ...credentials })
        enemyLaser.destroy()
    }

    destroy(game) {
        const animation = game.physics.add.sprite(this.ship.x, this.ship.y, 'ship')
        this.ship.destroy()
        // this.hp.destroy()
        this.checkPowerUpADestroy(game)
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