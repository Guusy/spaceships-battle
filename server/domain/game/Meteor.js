const { randomIntFromInterval } = require('../../utils')
class Meteor {

    constructor({ x }) {
        this.x = x
        this.y = 0
        this.scale = (randomIntFromInterval(10, 20) * 0.1)
        this.velocity = randomIntFromInterval(50, 100)
    }
}

module.exports = Meteor