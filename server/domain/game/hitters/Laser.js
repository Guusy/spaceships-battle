const GenericHitter = require('./GenericHitter')

class Laser extends GenericHitter {

    hit() {
        this.hitted.decreaseHp(30)
        this.hitted.lastLaserHit = {
            time: new Date().getTime(),
            playerName: this.hitter.playerName
        }
    }

    giveRewardsForTheKill(room) {
        const hitter = room.getPlayer(this.hitter.playerName)
        hitter.score += 25
        this.hitted.decreaseScore(25)
    }
}

module.exports = Laser