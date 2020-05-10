var config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1600,
    height: 900,
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
};


new Phaser.Game(config); //const game = 

var step = "SET_NAME"
var time = 0;
var gameFinished = false
let scoreboard;
let enemies = []

const getPowerup = (key) => window.powerups[key]

function preload() {
    preloadAssets(this)
}

function create() {
    var self = this;
    this.socket = io();
    this.sound.add('laserSound');
    this.anims.create({
        key: 'sprExplosion',
        frames: this.anims.generateFrameNumbers('sprExplosion'),
        frameRate: 20,
        repeat: 0
    })
    this.generateRandomId = () => '_' + Math.random().toString(36).substr(2, 9)
    this.isRunning = false;
    const game = (props) => {
        this.room = props.room
        step = "PLAYING_GAME"
        console.log("start the game")
        if (props.isAdmin) {
            this.initGameButton = this.add.text(window.innerWidth / 2, window.innerHeight * 0.7, `Start game`, { fontSize: '50px' });
            this.initGameButton.setInteractive({ useHandCursor: true })
                .on('pointerup', () => {
                    this.initGameButton.destroy()
                    this.socket.emit('initGame', this.player.connectionCredentials())
                });
        }
        this.otherPlayers = this.physics.add.group();
        this.timer = this.add.text(584, 16, "Waiting for others players", { fontSize: '32px' });
        this.playersQuantity = this.add.text(24, 16, `Room: ${this.room}`, { fontSize: '14px' });
        this.playersQuantity = this.add.text(24, 30, `Players: ${enemies.length + 1}`, { fontSize: '14px' });
        this.updatePlayersQuantity = () => {
            this.playersQuantity.setText(`Players: ${enemies.length + 1}`)
        }
        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'space': Phaser.Input.Keyboard.KeyCodes.SPACE,
            'dash': Phaser.Input.Keyboard.KeyCodes.K,
            'activatePowerup': Phaser.Input.Keyboard.KeyCodes.J,
        });

        this.latency = new Latency(this)

        this.socket.emit('enterGame', { playerName: props.playerName, room: props.room })

        this.socket.on('getPong', (id) => {
            this.latency.receivePong(id)
        })

        this.time.addEvent({
            delay: 250, // max 4 times per second
            loop: true,
            callback: () => this.latency.makePing()
        })

        this.lasers = this.physics.add.group()
        this.enemiesLasers = this.physics.add.group()
        this.meteors = this.physics.add.group()
        this.heart = new Heart(this)
        this.star = new Star(this)
        self.physics.add.overlap(self.lasers, self.meteors, destroyAll, null, self)
        self.physics.add.overlap(self.enemiesLasers, self.meteors, destroyAll, null, self)

        this.renderLaser = (group, { x, y, type, color, rotation, playerName }) => {
            var laser = group.create(x, y, 'laser');
            laser.setTint(color)
            laser.rotation = rotation
            laser.setData('playerName', playerName)
            laser.setData('type', type || 'default')
            this.physics.velocityFromRotation(rotation + 1.5, 3000, laser.body.acceleration);
        }

        this.findEnemyByName = (name) => enemies.find(enemy => enemy.data.playerName === name)
        this.findEnemyBySocket = (socketId) => enemies.find(enemy => enemy.data.playerId === socketId)

        this.socket.on('renderMeteor', (meteor) => {
            Meteor.render(this, meteor)
        });

        this.socket.on('heartLocation', (heartInfo) => {
            this.heart.render(heartInfo)
        });

        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                const currentPlayer = players[id]
                if (currentPlayer.playerId === this.socket.id) {
                    this.player = new Player(this, currentPlayer) //TODO: check if this make sense
                } else {
                    const enemy = new EnemyPlayer(this, currentPlayer)
                    enemies.push(enemy)
                }
            });
            this.updatePlayersQuantity()
        });

        this.socket.on('newPlayer', (playerInfo) => {
            const enemy = new EnemyPlayer(this, playerInfo)
            enemies.push(enemy)
            this.updatePlayersQuantity()
        });

        this.socket.on('disconnect', (socketId) => {
            const enemyToDelete = this.findEnemyBySocket(socketId)
            if (enemyToDelete) {
                //TODO: Think if we need a domain object to put this logic
                scoreboard.removeScore(enemyToDelete.playerName)
                enemyToDelete.destroy()
                enemies = enemies.filter(enemy => enemy.playerName !== enemyToDelete.playerName)
                this.updatePlayersQuantity()
            }
        });


        this.socket.on('playerMoved', (playerInfo) => {
            const enemy = this.findEnemyByName(playerInfo.playerName)
            // TODO: add a if please
            enemy.updateMovement(playerInfo)
        });

        this.socket.on('scoreUpdate', function (newScores) {
            if (!scoreboard) {
                scoreboard = new ScoreBoard(self, newScores)
            } else {
                scoreboard.updateScores(newScores)
            }
        });

        this.socket.on('starLocation', (starLocation) => {
            this.star.render(starLocation)
        });

        this.socket.on('playerShooted', ({ lasers }) => {
            this.sound.play('laserSound');
            if (Array.isArray(lasers)) {
                lasers.forEach(laser => this.renderLaser(self.enemiesLasers, laser))
            } else {
                this.renderLaser(self.enemiesLasers, lasers)
            }
        })

        this.socket.on('initTimmer', (starterTime) => {
            this.isRunning = true
            time = starterTime / 1000
            setInterval(() => {
                if (!gameFinished) {
                    time -= 1
                }
            }, 1000)
        })

        this.socket.on('finishGame', () => {
            gameFinished = true
        })

        this.socket.on('removePlayer', (playerName) => {
            if (this.player.isMe(playerName)) {
                this.player.destroy()
            } else {
                const enemy = this.findEnemyByName(playerName)
                enemy.destroy()
            }
        })

        this.socket.on('updateHp', ({ playerName, hp }) => {
            if (this.player.isMe(playerName)) {
                this.player.updateHp(hp)
            } else {
                const enemy = this.findEnemyByName(playerName)
                enemy.updateHp(hp)
            }
        })

        this.socket.on('renderPowerup', (powerup) => {
            Powerup.render(this, powerup)
        })

        this.socket.on('powerupCollected', ({ playerName, powerup }) => {
            // TODO: check if this is neccesary
            const enemy = this.findEnemyByName(playerName)
            const Powerup = getPowerup(powerup.type)
            const currentPowerup = new Powerup()
            enemy.powerup = currentPowerup
        });

        this.socket.on('powerupActivated', ({ playerName }) => { // powerup
            const enemy = this.findEnemyByName(playerName)
            enemy.activatePowerup()
        });

        this.socket.on('revivePlayer', (playerInfo) => {
            if (this.player.isMe(playerInfo.playerName)) {
                this.player.revive(playerInfo)
            } else {
                this.findEnemyByName(playerInfo.playerName).revive(playerInfo)
            }
        })
    }
    // game({ playerName: 'gonzalo', room: 'debug', isAdmin: true }) // debug mode
    menu(self, { joinGame: joinGame(self, game), createGame: createGame(self, game) })

}

function update(update_time, delta) {
    if (step !== "SET_NAME") {
        if (this.player && this.player.ship && this.player.ship.scene) {
            this.player.update(update_time, delta)
            if (scoreboard) {
                scoreboard.update(this)
            }
        }

        if (gameFinished) {
            finishGame(this)
        } else {
            this.timer.setText('Time:' + formatMinutes(time));
        }
    }
}


function finishGame(self) {
    gameFinished = false
    self.physics.pause()
    const sortedPlayers = scoreboard.getSortedScores()
    const x = self.game.config.width * 0.3
    const y = self.game.config.height * 0.3
    const [winner] = sortedPlayers
    self.add.text(x, y, 'Game finished', { fontSize: '32px', fill: 'white' });
    let scoreBoardLinePosition = y + 32
    self.add.text(x, scoreBoardLinePosition, 'Winner => ' + winner.playerName, { fontSize: '28px', fill: 'white' });

    sortedPlayers.forEach(aPlayer => {
        scoreBoardLinePosition += 32
        self.add.text(x, scoreBoardLinePosition, aPlayer.playerName + ': ' + aPlayer.score, { fontSize: '24px', fill: 'white' });
    })
}

// Game functionalities

function destroyAll(objectA, objectB) {
    objectA.destroy()
    objectB.destroy()
}

