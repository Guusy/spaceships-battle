var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
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
    }
};

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
            const layer = this.scene.add.sprite(0, 0, this.key)
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
var timerShootDelay = 10
var timerShootTick = timerShootDelay - 1

function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('star', 'assets/star_gold.png');
    this.load.image('laser', 'assets/laserPlayer.png');
    this.load.image('laserEnemy', 'assets/laserEnemy.png');
    this.load.image('bg0', 'assets/sprBg0.png')
    this.load.image('bg1', 'assets/sprBg1.png')
}

function create() {
    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
    this.cursors = this.input.keyboard.createCursorKeys();

    this.backgrounds = []
    for (let i = 0; i < 10; i++) {
        const keys = ['bg0', 'bg1']
        const key = keys[Phaser.Math.Between(0, keys.length - 1)]
        const bg = new ScrollingBackground(this, key, i * 10)
        this.backgrounds.push(bg)
    }

    this.lasers = this.physics.add.group({
        key: 'lasers',
    })

    this.enemiesLasers = this.physics.add.group({
        key: 'enemiesLasers',
    })

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

    this.socket.on('scoreUpdate', function (scores) {
        self.blueScoreText.setText('Blue: ' + scores.blue);
        self.redScoreText.setText('Red: ' + scores.red);
    });

    this.socket.on('starLocation', function (starLocation) {
        if (self.star) self.star.destroy();
        self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
        self.physics.add.overlap(self.ship, self.star, function () {
            this.socket.emit('starCollected');
        }, null, self);
    });

    this.socket.on('playerShooted', function (laser) {
        const isMe = laser.player === self.socket.id
        if (!isMe) {
            renderEnemylaser(self, laser)
        }
    })


}

function update() {
    if (this.ship && this.ship.scene) {
        if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-150);
        } else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(150);
        } else {
            this.ship.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
        } else {
            this.ship.setAcceleration(0);
        }

        if (this.cursors.space.isDown) {
            if (timerShootTick < timerShootDelay) {
                timerShootTick += 1
            } else {
                renderLaser(this, this.ship, this.lasers, 'laser')
                this.socket.emit('shoot', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
                timerShootTick = 0
            }
        }

        // emit player movement
        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.rotation;
        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
        }

        // save old position data
        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        };
    }

    for (var i = 0; i < this.backgrounds.length; i++) {
        this.backgrounds[i].update()
    }
}


function renderEnemylaser(self, ship) {
    renderLaser(self, ship, self.enemiesLasers, 'laserEnemy')
}

function renderLaser(self, ship, laserGroup, sprite) {
    var laser = laserGroup.create(ship.x, ship.y, sprite);
    laser.rotation = ship.rotation
    self.physics.velocityFromRotation(ship.rotation + 1.5, 600, laser.body.acceleration);
}

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
    self.ship.setCollideWorldBounds(true)
    self.physics.add.collider(self.ship, self.enemiesLasers, hitByLaser, null, self);
}

function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    otherPlayer.setTint(0xff0000);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setCollideWorldBounds(true)
    self.otherPlayers.add(otherPlayer);
}

function hitByLaser(player, laser) {
    console.log('hited')
    this.physics.pause();
    player.destroy()
    laser.destroy()
    // this.physics.pause();

    // player.setTint(0xff0000);

    // player.anims.play('turn');

    // gameOver = true;
}
