window.createGame = (self, nextStep) => () => {
    var element = self.add.dom(self.game.config.width * 0.5, 0).createFromCache('createGame');

    element.addListener('click');
    element.on('click', function (event) {
        if (event.target.name === 'createGame') {
            var playerName = this.getChildByName('nameField').value;
            var room = this.getChildByName('roomField').value;
            // var quantityPlayers = this.getChildByName('quantityField').value;
            var time = this.getChildByName('timeField').value;
            if (playerName !== '' && room !== '' && time !== '') {
                return fetch(`/rooms/${room}`)
                    .then(response => {
                        if (response.status === 404) {
                            this.setVisible(false);
                            self.socket.emit('createGame', { room, admin: playerName, time, width: Number.parseInt(self.game.config.width, 10) })
                            return nextStep({ playerName, isAdmin: true, room })
                        }
                        alert(`La sala ${room} ya existe`)
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
