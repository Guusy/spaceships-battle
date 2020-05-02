const { randomIntFromInterval } = require('../../utils')
const Meteor = require('./Meteor')
const Powerup = require('./Powerup')
const Star = require('./Star')

class Room {

    constructor({ name, quantityPlayers, time, colors, width }) {
        this.name = name
        this.isRunning = false
        this.quantityPlayers = quantityPlayers
        this.time = time
        this.colors = colors
        this.width = width
        this.players = {}
    }

    isGameReady() {
        const currentPlayers = Object.keys(this.players).length
        return !this.isRunning && this.quantityPlayers === currentPlayers
    }

    initGame(io, finishCallback) {
        this.isRunning = true
        // Send to the users the real time, to manage in the client
        io.in(this.name).emit('initTimmer', this.time);

        // send the current scores
        io.in(this.name).emit('scoreUpdate', this.getScores());

        console.log('The game will finish in', this.time)
        // Calculate the finish of the game

        this.meteorInterval = setInterval(() => {
            if (randomIntFromInterval(0, 10) >= 3) {
                const meteor = new Meteor({
                    x: randomIntFromInterval(0, this.width),
                })
                io.in(this.name).emit('renderMeteor', meteor)
            }
        }, 2000)

        setTimeout(() => {
            console.log("We gonna finish the game", this.name)
            io.in(this.name).emit('finishGame');
            this.clearIntervalMeteorInterval()
            finishCallback()
        }, this.time)

        // send the star object to the new player
        setTimeout(() => {
            io.in(this.name).emit('starLocation', new Star());
        }, 3000)

        // send the power up 
        setTimeout(() => {
            const powerUp = new Powerup()
            io.in(this.name).emit('renderPowerup', powerUp);
        }, 6000)
    }

    addPlayer(player) {
        this.players[player.playerName] = player
    }

    getPlayer(playerName) {
        return this.players[playerName]
    }

    getPlayerBysocket(socketId) {
        let user
        Object.keys(this.players).forEach(playerName => {
            const player = this.getPlayer(playerName)
            if (player.playerId === socketId) {
                user = player
            }
        })
        return user
    }

    removePlayer(playerName) {
        delete this.players[playerName]
    }

    updatePlayer(playerName, callback) {
        callback(this.getPlayer(playerName))
    }

    getScores() {
        return Object.keys(this.players).map(playerName => {
            const { score, color } = this.players[playerName]
            return { playerName, score, color }
        })
    }

    clearIntervalMeteorInterval(){
        clearInterval(this.meteorInterval)
    }

    isEmpty() {
        return Object.keys(this.players).length === 0
    }
}

module.exports = Room