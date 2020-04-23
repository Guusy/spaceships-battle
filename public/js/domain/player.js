window.Player = class Player {

    constructor(game, playerInfo) {
        this.self = this
        this.ship = game.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
        this.ship.setDrag(100);
        this.ship.setAngularDrag(100);
        this.ship.setMaxVelocity(200);
        this.ship.setCollideWorldBounds(true)
        this.ship.setData('playerName', playerInfo.playerName)
        this.ship.setData('canShoot', false)
        this.ship.setTint(0x737373)

        if (game.star) {
            game.physics.add.overlap(this.ship, game.star, (_, star) => this.collectStar(game, star));
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

    hitByMeteor(game, meteor) {
        this.destroy(game)
        meteor.destroy()
        if (!meteor.getData('isHited')) {
            const credentials = this.connectionCredentials()
            game.socket.emit('killed', { killer: null, ...credentials })
            game.socket.emit('meteorDestroyed', { id: meteor.getData('id'), ...credentials })
            meteor.setData('isHited', true)
        }
    }

    calculateMovement({ socket, cursors, physics }) {
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
                const color = `0x${player.data.color}`
                this.renderLaser(game, color)
                game.socket.emit('shoot',
                    { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation, color, ...this.connectionCredentials() });
                this.data.timerShootTick = 0
            }
        }
    }


    renderLaser(game, color) {
        var laser = game.lasers.create(this.ship.x, this.ship.y, 'laser');
        laser.setTint(color)
        laser.rotation = this.ship.rotation
        laser.setData('playerName', this.data.playerName)
        game.physics.velocityFromRotation(this.ship.rotation + 1.5, 3000, laser.body.acceleration);
    }

    hitByEnemyLaser(game, enemyLaser) {
        this.destroy(game)
        game.socket.emit('killed', { killer: enemyLaser.getData('playerName'), ...this.connectionCredentials() })
        enemyLaser.destroy()
    }

    destroy(game) {
        const animation = game.physics.add.sprite(this.ship.x, this.ship.y, 'ship')
        animation.setTexture('sprExplosion')
        animation.setScale(2.5, 2.5)
        animation.play('sprExplosion')
        animation.on('animationcomplete', () => {
            if (animation) {
                animation.destroy()
            }
        })
        this.ship.destroy()
    }

    connectionCredentials() {
        return {
            playerName: this.data.playerName,
            room: this.data.room
        }
    }
}