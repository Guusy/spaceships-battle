class Heart {

    constructor() {
        this.x = Math.floor(Math.random() * 700) + 50
        this.y = Math.floor(Math.random() * 500) + 50
    }

    applyModification(player) {
        player.increaseHp(40)
    }
}

module.exports = Heart