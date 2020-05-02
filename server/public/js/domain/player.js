window.Player = class Player extends GenericPlayer {

    constructor(game, playerInfo) {
        super(game, playerInfo)
        this.cooldownDash = 5000
        this.canDash = true
        this.data = {
            ...this.data,
            // TODO: move this to outside the data
            timerShootDelay: 30,
            timerShootTick: 29,
            canShoot: false,
        }
    }

    getSprite() {
        return 'ship'
    }

    doRender() {
        this.ship.setDrag(100);
        this.ship.setAngularDrag(100);
        this.ship.setMaxVelocity(200);

        if (this.game.star.isRenderInThePage()) {
            this.game.physics.add.overlap(this.ship, this.game.star.body, () => this.collectStar(this.game.star));
        }
        if (this.game.powerup) {
            this.game.physics.add.overlap(this.ship, this.game.powerup, (_, powerup) => this.collectPowerup(powerup));
        }
        setInterval(() => {
            this.canDash = true
        }, this.cooldownDash)
    }

    removeSpawnProtection() {
        this.data.canShoot = true
        this.game.physics.add.overlap(this.ship, this.game.meteors, (_, meteor) => this.hitByMeteor(meteor))
        this.game.physics.add.overlap(this.ship, this.game.enemiesLasers, (_, enemyLaser) => this.hitByEnemyLaser(enemyLaser));
    }

    doUpdate() {
        this.calculatePowerupActivation()
        this.calculateMovement()
        this.calculateShoot()
    }

    collectStar(star) {
        star.destroy()
        this.game.socket.emit('starCollected', this.connectionCredentials());
    }

    collectPowerup(powerup) {
        if (!this.powerup) {
            this.powerup = new powerups[powerup.getData('type')]()
            this.powerup.renderIcon(this.game)
            powerup.destroy()
            this.game.socket.emit('powerupCollected', { ...this.connectionCredentials(), powerup: this.powerup });
        }
    }

    hitByMeteor(meteor) {
        this.destroy()
        meteor.destroy()
        const credentials = this.connectionCredentials()
        this.game.socket.emit('killed', { killer: null, ...credentials })
    }

    checkPowerUpADestroy() {
        if (this.powerup) {
            this.powerup.destroy(this.game, this)
            this.powerup = null
        }
    }

    dash() {
        if (this.canDash) {
            this.canDash = false
            this.game.physics.velocityFromRotation(this.ship.rotation + 1.5, 30000, this.ship.body.acceleration);
        }
    }

    calculatePowerupActivation() {
        const { cursors } = this.game
        if (cursors.activatePowerup.isDown) {
            this.activatePowerup()
        }
    }

    activatePowerup() {
        if (this.powerup && !this.powerup.isActive) {
            this.game.socket.emit('powerupActivated', { ...this.connectionCredentials(), powerup: this.powerup })
            this.powerup.activate(this.game, this)
        }
    }

    calculateMovement() {
        const { socket, cursors, physics } = this.game

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
            this.dash()
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

    calculateShoot() {
        const canShoot = this.game.cursors.space.isDown && this.data.canShoot && this.game.isRunning
        if (canShoot) {
            if (this.data.timerShootTick < this.data.timerShootDelay) {
                this.data.timerShootTick += 1
            } else {
                this.game.sound.play('laserSound');
                this.shoot()
                this.data.timerShootTick = 0
            }
        }
    }

    shoot() {
        const color = `0x${this.data.color}`
        const id = this.game.generateRandomId()
        this.renderLaser({ id, color })
        const { room, playerName } = this.connectionCredentials()
        this.game.socket.emit('shoot', {
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


    renderLaser({ id, color }) {
        const { x, y, rotation } = this.ship
        const { playerName } = this.data
        this.game.renderLaser(this.game.lasers, { id, color, x, y, rotation, playerName })
    }
    // TODO: Unify with hit by meteor
    hitByEnemyLaser(enemyLaser) {
        this.destroy()
        const credentials = this.connectionCredentials()
        this.game.socket.emit('killed', { killer: enemyLaser.getData('playerName'), ...credentials })
        enemyLaser.destroy()
    }
}