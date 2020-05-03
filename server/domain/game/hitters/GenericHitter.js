class GenericHitter {

    constructor({ hitter, hitted }) {
        this.hitter = hitter
        this.hitted = hitted
    }

    hit() {
        throw new Error("Method not implemented.");
    }

    giveRewardsForTheKill() {
        throw new Error("Method not implemented.");
    }
}

module.exports = GenericHitter