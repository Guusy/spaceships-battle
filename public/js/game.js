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

function formatMinutes(time) {
    // Hours, minutes and seconds
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}


var game = new Phaser.Game(config);
class ScrollingBackground {
    constructor(scene, key, velocityY) {
        this.scene = scene
        this.key = key
        this.velocityY = velocityY

        this.layers = this.scene.add.group()

        this.createLayers()
    }

    createLayers() {
        for (let i = 0; i < 2; i++) {
            // creating two backgrounds will allow a continuous flow giving the illusion that they are moving.
            const width = this.scene.cameras.main.width
            const height = this.scene.cameras.main.height
            let layer = this.scene.add.sprite(width / 2, height / 2, this.key)
            let scaleX = width / layer.width
            let scaleY = height / layer.height
            let scale = Math.max(scaleX, scaleY)
            layer.setScale(scale).setScrollFactor(0)
            layer.y = layer.displayHeight * i
            const flipX = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1
            const flipY = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1
            layer.setScale(flipX * 2, flipY * 2)
            layer.setDepth(-5 - (i - 1))
            this.scene.physics.world.enableBody(layer, 0)
            layer.body.velocity.y = this.velocityY

            this.layers.add(layer)
        }
    }

    update() {
        if (this.layers.getChildren()[0].y > 0) {
            for (let i = 0; i < this.layers.getChildren().length; i++) {
                const layer = this.layers.getChildren()[i]
                layer.y = -layer.displayHeight + layer.displayHeight * i
            }
        }
    }
}


var laser
var bullets;
var fireRate = 100;
var nextFire = 0;
var timerShootDelay = 30
var timerShootTick = timerShootDelay - 1
var step = "SET_NAME"
var playerName;
var room;
var time = 0;
var gameFinished = false
var scores;
var scoresTexts;

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
        playerName = props.playerName
        room = props.room
        step = "PLAYING_GAME"
        console.log("start the game")

        this.otherPlayers = this.physics.add.group();
        this.timer = this.add.text(584, 16, "Waiting for others players", { fontSize: '32px' });
        this.cursors = this.input.keyboard.createCursorKeys();

        this.socket.emit('enterGame', { playerName, room })

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
                    addPlayer(self, players[id]);
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
            scores = newScores
            if (!scoresTexts) {
                scoresTexts = {}
                let scorePosition = 32
                Object.keys(scores).forEach(player => {
                    scoresTexts[player] = self.add.text(64, scorePosition, player + ': ' + scores[player], { fontSize: '18px', fill: '#0000FF' });
                    scorePosition += 16
                })
            }
        });

        this.socket.on('starLocation', function (starLocation) {
            if (self.star) self.star.destroy();
            self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
            self.star.setTint(0x737373)
            setTimeout(() => {
                self.star.clearTint()
                self.physics.add.overlap(self.ship, self.star, collectStar, null, self);
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
            const isMe = playerInfo.playerName === playerName
            if (isMe) {
                addPlayer(self, playerInfo);
            } else {
                addOtherPlayers(self, playerInfo);
            }
        })
    }

    menu(self, { joinGame: joinGame(self, game), createGame: createGame(self, game) })

}

function update() {
    if (step !== "SET_NAME") {
        if (this.ship && this.ship.scene) {
            if (this.cursors.left.isDown) {
                this.ship.setAngularVelocity(-150);
            } else if (this.cursors.right.isDown) {
                this.ship.setAngularVelocity(150);
            } else {
                this.ship.setAngularVelocity(0);
            }

            if (this.cursors.up.isDown) {
                this.physics.velocityFromRotation(this.ship.rotation + 1.5, 500, this.ship.body.acceleration);
            } else {
                this.ship.setAcceleration(0);
            }

            if (this.cursors.space.isDown && this.ship.getData('canShoot')) {
                if (timerShootTick < timerShootDelay) {
                    timerShootTick += 1
                } else {
                    this.sound.play('laserSound');
                    renderLaser(this, this.ship, this.lasers, 0x8feb34)
                    this.socket.emit('shoot', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation, ...connectionCredentials() });
                    timerShootTick = 0
                }
            }

            // emit player movement
            var x = this.ship.x;
            var y = this.ship.y;
            var r = this.ship.rotation;
            if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
                this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation, ...connectionCredentials() });
            }

            // save old position data
            this.ship.oldPosition = {
                x: this.ship.x,
                y: this.ship.y,
                rotation: this.ship.rotation,
                playerName
            };

            if (scores) {
                const sortedScoresKey = Object.keys(scores).sort((a, b) => scores[b] - scores[a])
                sortedScoresKey.forEach(player => {
                    if (scoresTexts[player]) {
                        scoresTexts[player].setText(player + ': ' + scores[player])
                    }
                })
            }
        }



        if (gameFinished) {
            gameFinished = false
            this.physics.pause()
            const sortedScoresKey = Object.keys(scores).sort((a, b) => scores[b] - scores[a])
            const x = self.game.config.width * 0.3
            const y = self.game.config.height * 0.3
            const [winner, ...otherPlayers] = sortedScoresKey
            this.add.text(x, y, 'Game finished', { fontSize: '32px', fill: 'white' });
            let scoreBoardLinePosition = y + 32
            this.add.text(x, scoreBoardLinePosition, 'Winner => ' + winner, { fontSize: '28px', fill: 'white' });

            sortedScoresKey.forEach(player => {
                scoreBoardLinePosition += 32
                this.add.text(x, scoreBoardLinePosition, player + ': ' + scores[player], { fontSize: '24px', fill: 'white' });
            })
        } else {
            this.timer.setText('Time:' + formatMinutes(time));
        }
    }


    // for (var i = 0; i < this.backgrounds.length; i++) {
    //     this.backgrounds[i].update()
    // }
}


// Game functions
function renderEnemylaser(self, laser) {
    renderLaser(self, laser, self.enemiesLasers, 0xde2323)
}

function renderLaser(self, ship, laserGroup, color) {
    var laser = laserGroup.create(ship.x, ship.y, 'laser');
    laser.setTint(color)
    laser.rotation = ship.rotation
    laser.setData('playerName', ship.playerName)
    self.physics.velocityFromRotation(ship.rotation + 1.5, 3000, laser.body.acceleration);
}

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
    self.ship.setCollideWorldBounds(true)
    self.ship.setData('playerName', playerInfo.playerName)
    self.ship.setData('canShoot', false)

    if (self.star) {
        self.physics.add.overlap(self.ship, self.star, collectStar, null, self);
    }
    self.ship.setTint(0x737373)

    setTimeout(() => {
        self.ship.clearTint()
        self.ship.setData('canShoot', true)
        self.physics.add.overlap(self.ship, self.meteors, hitByMeteor, null, self)
        self.physics.add.overlap(self.ship, self.enemiesLasers, hitByLaser, null, self);
    }, 3000)

}

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    otherPlayer.setTint(0xff0000);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setData('playerName', playerInfo.playerName)
    otherPlayer.setCollideWorldBounds(true)
    self.otherPlayers.add(otherPlayer);
    otherPlayer.setTint(0x737373)

    setTimeout(() => {
        otherPlayer.setTint(0xff0000);
    }, 2000)
}

function hitByLaser(player, laser) {
    destroyPlayer(this, player)
    this.socket.emit('killed', { killer: laser.getData('playerName'), ...connectionCredentials() })
    laser.destroy()
}

function hitByMeteor(player, meteor) {
    destroyPlayer(this, player)
    meteor.destroy()

    if (!meteor.getData('isHited')) {
        this.socket.emit('killed', { killer: null, ...connectionCredentials() })
        this.socket.emit('meteorDestroyed', { id: meteor.getData('id'), ...connectionCredentials() })
        meteor.setData('isHited', true)
    }

}

function laserHitMeteor(laser, meteor) {
    meteor.destroy()
    if (!meteor.getData('isHited')) {
        meteor.setData('isHited', true)
        this.socket.emit('meteorDestroyed', { id: meteor.getData('id'), ...connectionCredentials() })
    }
}

function collectStar(ship, star) {
    // TODO: change the logic to put a conditional
    star.destroy()
    this.socket.emit('starCollected', connectionCredentials());
}
function connectionCredentials() {
    return {
        playerName,
        room
    }
}


// Player functionaniltiies 

function destroyPlayer(self, player) {
    const animation = self.physics.add.sprite(player.x, player.y, 'ship')
    animation.setTexture('sprExplosion')
    animation.setScale(2.5, 2.5)
    animation.play('sprExplosion')
    player.destroy()
}