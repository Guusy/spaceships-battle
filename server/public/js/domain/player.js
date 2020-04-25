window.Player = class Player {

    constructor(game, playerInfo) {
        this.powerup;
        this.self = this
        this.ship = game.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
        this.ship.setDrag(100);
        this.ship.setAngularDrag(100);
        this.ship.setMaxVelocity(200);
        this.ship.setCollideWorldBounds(true)
        this.ship.setData('playerName', playerInfo.playerName)
        this.ship.setTint(0x737373)

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
            powerup.destroy()
            game.socket.emit('powerupCollected', { ...this.connectionCredentials(), powerup });
        }
    }

    hitByMeteor(game, meteor) {
        this.destroy(game)
        meteor.destroy()
        const credentials = this.connectionCredentials()
        game.socket.emit('killed', { killer: null, ...credentials })
    }

    checkPowerUpActivation(game) {
        if (this.powerup) {
            this.powerup.activate(game, this)
        }
    }

    checkPowerUpAUpdate(game) {
        if (this.powerup) {
            this.powerup.update(game, this)
        }
    }

    checkPowerUpADestroy(game) {
        if (this.powerup) {
            this.powerup.destroy(game, this)
        }
    }

    calculateMovement(game) {
        const { socket, cursors, physics } = game

        this.checkPowerUpAUpdate(game)

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