window.Player = class Player extends GenericPlayer {

    constructor(game, playerInfo) {
        super(game, playerInfo)
        this.cooldownDash = 2000
        this.lastDash = 0
        this.velocity = 500
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
        this.data.canShoot = false;
    }

    removeSpawnProtection() {
        this.data.canShoot = true

        if (this.game.star.isRenderInThePage()) {
            // TODO: move this overlap logic to the domain object, to avoid duplicate code
            this.game.physics.add.overlap(this.ship, this.game.star.body, () => this.collectStar(this.game.star));
        }

        if (this.game.heart.isRenderInThePage()) {
            // TODO: move this overlap logic to the domain object, to avoid duplicate code
            this.game.physics.add.overlap(this.ship, this.game.heart.body, () => this.collectHeart(this.game.heart));
        }

        if (this.game.powerup) {
            // TODO: move this overlap logic to the domain object, to avoid duplicate code
            this.game.physics.add.overlap(this.ship, this.game.powerup, (_, powerup) => this.collectPowerup(powerup));
        }

        this.game.physics.add.overlap(this.ship, this.game.meteors, (_, meteor) => this.hitByMeteor(meteor))
        this.game.physics.add.overlap(this.ship, this.game.enemiesLasers, (_, enemyLaser) => this.hitByEnemyLaser(enemyLaser));
        this.game.physics.add.overlap(this.ship, this.game.IALasers, (_, IABullet) => this.hitByAIBullet(IABullet));
    }

    doUpdate(time, delta) {
        this.calculatePowerupActivation()
        this.calculateMovement(time, delta)
        this.calculateShoot()
    }

    collectStar(star) {
        star.destroy()
        this.game.socket.emit('starCollected', this.connectionCredentials());
    }

    collectHeart(heart) {
        heart.destroy()
        this.game.socket.emit('heartCollected', this.connectionCredentials());
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
        meteor.destroy();
        this.game.cameras.main.shake(250, 0.006, false);
        const credentials = this.connectionCredentials()
        this.game.socket.emit('playerHitted', {
            hitter: 'meteor',
            hitted: {
                ...credentials
            },
            room: credentials.room
        })
    }

    dash(time) {
        if (time > this.lastDash + this.cooldownDash) {
            this.lastDash = time;
            this.game.physics.velocityFromRotation(this.ship.rotation + Math.PI / 2, 10000, this.ship.body.acceleration);
            this.ship.body.setMaxSpeed(700);
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

    calculateMovement(time) {
        const { socket, cursors, physics } = this.game

        if (cursors.left.isDown) {
            this.ship.setAngularVelocity(-150);
        } else if (cursors.right.isDown) {
            this.ship.setAngularVelocity(150);
        } else {
            this.ship.setAngularVelocity(0);
        }
 
        this.ship.body.setMaxSpeed(300);
        if (time < this.lastDash + 200) {
            this.ship.body.setMaxSpeed(700);
        } else if (cursors.up.isDown) {
            physics.velocityFromRotation(this.ship.rotation + Math.PI / 2, this.velocity, this.ship.body.acceleration);
        } else if (cursors.down.isDown) {
            physics.velocityFromRotation(this.ship.rotation + Math.PI / 2, -this.velocity, this.ship.body.acceleration);
        } else{
            this.ship.setAcceleration(0);
        }
        

        if (cursors.dash.isDown) {
            this.dash(time)
        }
        // this.updateBars();
        // emit player movement
        const { x, y, rotation, body, oldPosition } = this.ship;
        const acceleration = {...body.acceleration};
        const velocity = {...body.velocity};
        const { maxSpeed } = body;
        
        if (oldPosition &&
            (rotation !== oldPosition.rotation || maxSpeed !== oldPosition.maxSpeed ||
                acceleration.x !== oldPosition.acceleration.x || acceleration.y !== oldPosition.acceleration.y)) {                
                socket.emit('playerMovement', { x, y, rotation, acceleration, velocity, maxSpeed, ...this.connectionCredentials() });
        }

        // save old position data
        this.ship.oldPosition = { x, y, rotation, acceleration, velocity, maxSpeed };
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

    shoot(type = 'default') {
        const color = `0x${this.data.color}`
        const id = this.game.generateRandomId()
        this.renderLaser({ id, color })
        const { room, playerName } = this.connectionCredentials()
        this.game.socket.emit('shoot', {
            room,
            lasers: {
                id,
                type,
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
        const credentials = this.connectionCredentials()
        const currentLaser = laserMapper(enemyLaser.getData('type'))
        currentLaser.applyIn(this)
        this.game.socket.emit('playerHitted', {
            hitter: 'laser', // TODO: in the future get the type of laser
            hitted: {
                ...credentials
            },
            hitterMetadata: {
                playerName: enemyLaser.getData('playerName')
            },
            room: credentials.room
        })
        enemyLaser.destroy()
    }

    hitByAIBullet(bullet){
        const credentials = this.connectionCredentials()
        this.game.socket.emit('playerHitted', {
            hitter: 'bullet',
            hitted: {
                ...credentials
            },
            hitterMetadata: {
                playerName: 'ia'
            },
            room: credentials.room
        })
        bullet.destroy()
    }

    slowVelocity(amount) {
        const difference = this.velocity - amount
        this.velocity = (difference > 50) ? difference : 50
    }

    restoreDefaultVelocity() {
        this.velocity = 500
    }
}