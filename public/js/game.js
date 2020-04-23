const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
const DEFAULT_HEIGHT = 720 // any height you want
const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1000,
    height: DEFAULT_HEIGHT,
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


    const game = (props) => {
        this.room = props.room
        step = "PLAYING_GAME"
        console.log("start the game")

        this.otherPlayers = this.physics.add.group();
        this.timer = this.add.text(584, 16, "Waiting for others players", { fontSize: '32px' });
        this.cursors = this.input.keyboard.createCursorKeys();

        this.socket.emit('enterGame', { playerName: props.playerName, room: props.room })

        this.lasers = this.physics.add.group()
        this.enemiesLasers = this.physics.add.group()
        this.meteors = this.physics.add.group()

        self.physics.add.overlap(self.lasers, self.meteors, laserHitMeteor, null, self)

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

        this.socket.on('playerShooted', function (laser) {
            self.sound.play('laserSound');
            const isMe = laser.player === self.socket.id
            if (!isMe) {
                renderEnemylaser(self, laser)
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

        this.socket.on('meteorDestroyed', (id) => {
            self.meteors.getChildren().forEach((meteor) => {
                if (meteor.getData('id') === id) {
                    meteor.destroy()
                }
            })
        })

        this.socket.on('removePlayer', (playerName) => {
            console.log('removePlayer', playerName)
            self.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerName === otherPlayer.getData('playerName')) {
                    destroyPlayer(this, otherPlayer)
                }
            });
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
function renderEnemylaser(self, enemyLaser) {
    var laser = self.enemiesLasers.create(enemyLaser.x, enemyLaser.y, 'laser');
    laser.setTint(enemyLaser.color)
    laser.rotation = enemyLaser.rotation
    laser.setData('playerName', enemyLaser.playerName)
    self.physics.velocityFromRotation(enemyLaser.rotation + 1.5, 3000, laser.body.acceleration);
}

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
    }, 2000)
}

// Player functionaniltiies 

function destroyPlayer(self, player) {
    const animation = self.physics.add.sprite(player.x, player.y, 'ship')
    animation.setTexture('sprExplosion')
    animation.setScale(2.5, 2.5)
    animation.play('sprExplosion')
    animation.on('animationcomplete', () => {
        if (animation) {
            animation.destroy()
        }
    })
    player.destroy()
}

// Game functionalities

function laserHitMeteor(laser, meteor) {
    meteor.destroy()
    if (!meteor.getData('isHited')) {
        meteor.setData('isHited', true)
        this.socket.emit('meteorDestroyed', { id: meteor.getData('id'), ...player.connectionCredentials() })
    }
}