window.joinGame = (self, goToPlay) => () => {
    var element = self.add.dom(self.game.config.width * 0.5, 0).createFromCache('nameform');

    element.addListener('click');
    element.on('click', function (event) {
        if (event.target.name === 'playButton') {
            var playerName = this.getChildByName('nameField').value;
            var room = this.getChildByName('roomField').value;
            if (playerName !== '' && room !== '') {
                return fetch(`/rooms/${room}`)
                    .then((response) => {
                        return response.json()
                            .then(data => {
                                if (response.status === 200) {
                                    if (data.players[playerName]) {
                                        return alert(`El nombre ${playerName} ya existe en la sala`)
                                    }
                                    this.setVisible(false);
                                    return goToPlay({ playerName, room })
                                }
                                alert(`La sala ${room} no existe`)
                            })
                    })
            }
        }
    })
    self.tweens.add({
        targets: element,
        y: 300,
        duration: 1500,
        ease: 'Power3'
    });
}