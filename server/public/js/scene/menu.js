window.menu = (self, { joinGame, createGame }) => {
    var element = self.add.dom(window.innerWidth / 2, 0).createFromCache('menu');

    element.addListener('click');
    element.on('click', function ({ target: { name } }) {
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