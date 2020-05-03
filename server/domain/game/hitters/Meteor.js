const GenericHitter = require('./GenericHitter')

class Meteor extends GenericHitter {

    giveRewardsForTheKill(room) {
        if (this.hitted.lastLaserHit) {
            const { playerName, time } = this.hitted.lastLaserHit
            const diff = (new Date().getTime() - time) / 1000
            if (diff <= 5) {
                const lastHitter = room.getPlayer(playerName)
                lastHitter.score += 25
                this.hitted.decreaseScore(25)
            }
        }
    }

    hit() {
        this.hitted.decreaseHp(20)
    }
}

module.exports = Meteor