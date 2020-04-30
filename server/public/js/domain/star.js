
window.Star = class Start {

    constructor(game) {
        this.game = game
        this.body = null
    }

    render(starLocation) {
        if (this.body) {
            this.destroy()
        }
        this.body = this.game.physics.add.image(starLocation.x, starLocation.y, 'star');
        this.body.setTint(0x737373)
        setTimeout(() => {
            this.body.clearTint()
            this.game.physics.add.overlap(this.game.player.ship, this.body, () => this.game.player.collectStar(this));
        }, 3000)
    }

    isRenderInThePage(){
        return !!this.body
    }
    
    destroy() {
        this.body.destroy()
    }
}