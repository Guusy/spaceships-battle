window.Latency = class Latency {

    constructor(game) {
        this.current = 0
        this.high = 0
        this.low = 0
        this.ping = 0
        this.id = ''
        this.canSend = true
        this.history = []
        this.game = game;
        this.text = game.add.text(
            game.cameras.main.width - 240,
            20,
            '',
            {
                color: '#ffffff',
                fontSize: 16
            })
            .setOrigin(0.5)
            .setResolution(window.devicePixelRatio)
            .setScrollFactor(0)
            .setDepth(100)

    }

    makePing() {
        if (!this.canSend) return
        this.ping = new Date().getTime()
        this.id = Phaser.Math.RND.uuid()
        this.canSend = false
        this.game.socket.emit('sendPing', this.id)
    }

    receivePong(id) {
        if (this.id !== id) return
        this.canSend = true
        this.current = new Date().getTime() - this.ping
        if (this.history.length >= 200) this.history.shift()
        this.history.push(this.current)
        this.render()
    }

    render() {
        if (isNaN(this.current)) return
        if (isNaN(this.high) || this.current > this.high) this.high = this.current
        if (isNaN(this.low) || this.current < this.low) this.low = this.current

        let sum = this.history.reduce((previous, current) => (current += previous))
        let avg = sum / this.history.length

        this.text.setText(
            `Ping ${this.current}ms (avg ${Math.round(avg)}ms / low ${this.low}ms / high ${this.high}ms)`
        )
    }
}