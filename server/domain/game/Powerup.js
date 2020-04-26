const powerups = require('../powerups')
const { randomIntFromInterval } = require('../../utils')
class Powerup {

    constructor() {
        const { type, icon } = powerups[randomIntFromInterval(0, powerups.length - 1)]
        this.x = Math.floor(Math.random() * 700) + 50
        this.y = Math.floor(Math.random() * 500) + 50
        this.type = type
        this.icon = icon
    }
}

module.exports = Powerup