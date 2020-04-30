var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
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
const enemies = []

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

    const game = (props) => {
        this.room = props.room
        step = "PLAYING_GAME"
        console.log("start the game")

        this.otherPlayers = this.physics.add.group();
        this.timer = this.add.text(584, 16, "Waiting for others players", { fontSize: '32px' });
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
        this.star = new Star(this)
        self.physics.add.overlap(self.lasers, self.meteors, destroyAll, null, self)
        self.physics.add.overlap(self.enemiesLasers, self.meteors, destroyAll, null, self)

        this.renderLaser = (group, { x, y, color, rotation, playerName }) => {
            var laser = group.create(x, y, 'laser');
            laser.setTint(color)
            laser.rotation = rotation
            laser.setData('playerName', playerName)
            this.physics.velocityFromRotation(rotation + 1.5, 3000, laser.body.acceleration);
        }

        this.findEnemyByName = (name) => enemies.find(enemy => enemy.data.playerName === name)
        this.findEnemyBySocket = (socketId) => enemies.find(enemy => enemy.data.playerId === socketId)

        this.socket.on('renderMeteor', ({ id, x, y, scale, velocity }) => {
            //TODO: create a domain object for this
            const meteor = this.meteors.create(x, y, 'meteor')
            meteor.setScale(scale)
            this.meteors.add(meteor)
            meteor.setData('id', id)
            meteor.body.velocity.y = velocity
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
        });

        this.socket.on('newPlayer', (playerInfo) => {
            const enemy = new EnemyPlayer(this, playerInfo)
            enemies.push(enemy)
        });

        this.socket.on('disconnect', (socketId) => {
            //TODO: modify this
            const enemy = this.findEnemyBySocket(socketId)
            if (enemy) {
                enemy.destroy()
            }
        });


        this.socket.on('playerMoved', (playerInfo) => {
            const enemy = this.findEnemyByName(playerInfo.playerName)
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
            const enemy = this.findEnemyByName(playerName)
            enemy.destroy()
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
            const isMe = playerInfo.playerName === this.player.data.playerName
            if (isMe) {
                this.player = new Player(self, playerInfo)
            } else {
                this.findEnemyByName(playerInfo.playerName).revive(playerInfo)
                // addOtherPlayers(self, playerInfo);
            }
        })
    }
    // game({ playerName: 'gonzalo', room: 'debug' }) // debug mode
    menu(self, { joinGame: joinGame(self, game), createGame: createGame(self, game) })

}

function update() {
    if (step !== "SET_NAME") {
        if (this.player && this.player.ship && this.player.ship.scene) {
            this.player.update(this)
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

