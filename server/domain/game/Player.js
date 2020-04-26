class Player {

    constructor({ playerName, room, playerId, color }) {
        this.playerId = playerId
        this.playerName = playerName
        this.room = room
        this.color = color
        this.x = Math.floor(Math.random() * 700) + 50
        this.y = Math.floor(Math.random() * 500) + 50
        this.score = 0
        this.rotation = 0
    }
}

module.exports = Player