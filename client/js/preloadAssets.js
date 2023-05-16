window.preloadAssets = (game) => {
    game.load.image('ship', 'assets/spaceShips_001.png');
    game.load.image('slowLaser', 'assets/slowLaser.png');
    game.load.image('otherPlayer', 'assets/enemyBlack5.png');
    game.load.image('star', 'assets/star_gold.png');
    game.load.image('heart', 'assets/heart.png');
    game.load.image('bomb', 'assets/bomb.png');
    game.load.image('laser', 'assets/laserPlayer.png');
    game.load.image('laserEnemy', 'assets/laserEnemy.png');
    game.load.image('bg0', 'assets/sprBg0.png')
    game.load.image('bg1', 'assets/sprBg1.png')
    game.load.image('meteor', 'assets/meteorGrey_small1.png')
    game.load.image('shieldWithTime', 'assets/powerups/shieldWithTime.png');
    game.load.image('angularLaser', 'assets/powerups/angularLaser.png');
    game.load.html('nameform', 'assets/nameform.html');
    game.load.html('createGame', 'assets/createGame.html');
    game.load.html('menu', 'assets/menu.html');
    game.load.spritesheet('sprExplosion', 'assets/sprExplosion.png', {
        frameWidth: 32,
        frameHeight: 32
    })
    game.load.audio('laserSound', 'assets/audio/laser.ogg', {
        instances: 1
    });
    game.load.atlas('space', 'assets/space.png', 'assets/space.json');
}