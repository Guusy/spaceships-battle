// TODO: check the star.js file, is the same logic
window.Heart = class Heart {

    constructor(game) {
        this.game = game
        this.body = null
    }

    render({ x, y }) {
        if (this.body) {
            this.destroy()
        }

        this.body = this.game.physics.add.image(x, y, 'heart').setDisplaySize(50, 50);
        this.body.setTint(0x737373)
        setTimeout(() => {
            this.body.clearTint()
            this.game.physics.add.overlap(this.game.player.ship, this.body, () => this.game.player.collectHeart(this.body));
        }, 3000)
    }

    isRenderInThePage() {
        return !!this.body
    }

    destroy() {
        this.body.destroy()
    }
}