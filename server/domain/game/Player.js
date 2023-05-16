class Player {

    constructor({playerName, room, playerId, color}) {
        this.playerId = playerId
        this.playerName = playerName
        this.room = room
        this.color = color
        this.x = Math.floor(Math.random() * 700) + 50
        this.y = Math.floor(Math.random() * 500) + 50
        this.score = 0
        this.rotation = 0
        this.hp = 100
    }

    isDead() {
        return this.hp === 0
    }

    decreaseHp(amount) {
        const difference = this.hp - amount
        this.hp = (difference >= 0) ? difference : 0
    }

    increaseHp(amount) {
        const difference = this.hp + amount
        this.hp = (difference <= 100) ? difference : 100
    }

    revive() {
        this.hp = 100
        this.x = Math.floor(Math.random() * 700) + 50
        this.y = Math.floor(Math.random() * 500) + 50
    }

    decreaseScore(amount) {
        const newScore = this.score - amount
        this.score = (newScore >= 0) ? newScore : 0
    }

    increaseScore(amount){
        this.score += amount
    }

    collect(collectable) {
        collectable.applyModification(this)
    }

    updatePosition({x, y, rotation, acceleration, velocity, maxSpeed}) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.acceleration = acceleration;
        this.velocity = velocity;
        this.maxSpeed = maxSpeed;
    }
}

module.exports = Player