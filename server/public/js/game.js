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

const sortPlayerByScore = (players) => players.sort((playerA, playerB) => playerB.score - playerA.score)

var game = new Phaser.Game(config);

var step = "SET_NAME"
var room;
var time = 0;
var gameFinished = false
let scoreboard;
let player;

function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('star', 'assets/star_gold.png');
    this.load.image('laser', 'assets/laserPlayer.png');
    this.load.image('laserEnemy', 'assets/laserEnemy.png');
    this.load.image('bg0', 'assets/sprBg0.png')
    this.load.image('bg1', 'assets/sprBg1.png')
    this.load.image('meteor', 'assets/meteorGrey_small1.png')
    this.load.image('shield_silver', 'assets/powerups/shield_silver.png');
    this.load.image('angularLaser', 'assets/powerups/angularLaser.png');
    this.load.html('nameform', 'assets/nameform.html');
    this.load.html('createGame', 'assets/createGame.html');
    this.load.html('menu', 'assets/menu.html');
    this.load.spritesheet('sprExplosion', 'assets/sprExplosion.png', {
        frameWidth: 32,
        frameHeight: 32
    })
    this.load.audio('laserSound', 'assets/audio/laser.ogg', {
        instances: 1
    });
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
        // this.input.keyboard.addKeys();
        this.cursors = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'right': Phaser.Input.Keyboard.KeyCodes.D,
            'space': Phaser.Input.Keyboard.KeyCodes.SPACE,
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
        this.lasers = this.physics.add.group()
        this.enemiesLasers = this.physics.add.group()
        this.meteors = this.physics.add.group()

        self.physics.add.overlap(self.lasers, self.meteors, destroyAll, null, self)
        self.physics.add.overlap(self.enemiesLasers, self.meteors, destroyAll, null, self)

        this.input.keyboard.on('keydown-J', () => player.checkPowerUpActivation(this));

        this.renderLaser = (group, { x, y, color, rotation, playerName }) => {
            var laser = group.create(x, y, 'laser');
            laser.setTint(color)
            laser.rotation = rotation
            laser.setData('playerName', playerName)
            this.physics.velocityFromRotation(rotation + 1.5, 3000, laser.body.acceleration);
        }

        this.socket.on('renderMeteor', ({ id, x, y, scale, velocity }) => {
            meteor = this.meteors.create(x, y, 'meteor')
            meteor.setScale(scale)
            this.meteors.add(meteor)
            meteor.setData('id', id)
            meteor.body.velocity.y = velocity
        });

        this.socket.on('currentPlayers', function (players) {
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    player = new Player(self, players[id])
                } else {
                    addOtherPlayers(self, players[id]);
                }
            });
        });

        this.socket.on('newPlayer', function (playerInfo) {
            addOtherPlayers(self, playerInfo);
        });

        this.socket.on('disconnect', function (playerId) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });


        this.socket.on('playerMoved', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setRotation(playerInfo.rotation);
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                }
            });

        });

        this.socket.on('scoreUpdate', function (newScores) {
            if (!scoreboard) {
                scoreboard = new ScoreBoard(self, newScores)
            } else {
                scoreboard.updateScores(newScores)
            }
        });

        this.socket.on('starLocation', function (starLocation) {
            if (self.star) self.star.destroy();
            self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
            self.star.setTint(0x737373)
            setTimeout(() => {
                self.star.clearTint()
                self.physics.add.overlap(player.ship,
                    self.star,
                    (_, star) => player.collectStar(self, star));
            }, 3000)
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
            self.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerName === otherPlayer.getData('playerName')) {
                    destroyPlayer(this, otherPlayer)
                }
            });
        })

        this.socket.on('renderPowerup', (powerup) => {
            if (self.powerup) self.powerup.destroy();
            self.powerup = self.physics.add.image(powerup.x, powerup.y, powerup.icon);
            self.powerup.setData('type', powerup.type)
            self.powerup.setTint(0x737373)
            setTimeout(() => {
                self.powerup.clearTint()
                self.physics.add.overlap(player.ship,
                    self.powerup,
                    (_, powerup) => player.collectPowerup(self, powerup));
            }, 3000)
        })

        this.socket.on('revivePlayer', (playerInfo) => {
            const isMe = playerInfo.playerName === player.data.playerName
            if (isMe) {
                player = new Player(self, playerInfo)
            } else {
                addOtherPlayers(self, playerInfo);
            }
        })
    }
    // game({ playerName: 'gonzalo', room: 'debug' }) // debug mode
    menu(self, { joinGame: joinGame(self, game), createGame: createGame(self, game) })

}

function update() {
    if (step !== "SET_NAME") {
        if (player && player.ship && player.ship.scene) {
            player.calculateMovement(this)
            player.calculateShoot(this)
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

// Game functions of enemies TODO: Migrate to a domain object

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    otherPlayer.setTint(0xff0000);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setData('playerName', playerInfo.playerName)
    otherPlayer.setCollideWorldBounds(true)
    otherPlayer.setTint(0x737373)
    self.otherPlayers.add(otherPlayer);

    setTimeout(() => {
        otherPlayer.setTint(`0x${playerInfo.color}`);
        //     self.physics.add.collider(otherPlayer, self.lasers, somethingHitsAEnemy, null, self)
        self.physics.add.overlap(otherPlayer, self.meteors, somethingHitsAEnemy, null, self)
    }, 2500)
}

// Player functionaniltiies 

function destroyPlayer(self, player) {
    const animation = self.physics.add.sprite(player.x, player.y, 'ship')
    player.destroy()
    animation.setTexture('sprExplosion')
    animation.setScale(2.5, 2.5)
    animation.play('sprExplosion')
    animation.on('animationcomplete', () => {
        if (animation) {
            animation.destroy()
        }
    })
}

// Game functionalities

function destroyAll(objectA, objectB) {
    objectA.destroy()
    objectB.destroy()
}

// TODO: decide which one has the source of the true, the enemy or you
function somethingHitsAEnemy(enemy, object) {
    // destroyPlayer(this, enemy)
    object.destroy()
}