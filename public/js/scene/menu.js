window.menu = (self, { joinGame, createGame }) => {
    var element = self.add.dom(self.game.config.width * 0.5, 0).createFromCache('menu');

    element.addListener('click');
    element.on('click', function ({ target: { name } }) {
        console.log('wtfff')
        if (name === 'createGame') {
            this.setVisible(false);
            createGame()
        }
        if (name === 'joinGame') {
            this.setVisible(false);
            joinGame()
        }
    })
    self.tweens.add({
        targets: element,
        y: 300,
        duration: 1500,
        ease: 'Power3'
    });
}