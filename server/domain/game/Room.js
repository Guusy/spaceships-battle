const {randomIntFromInterval} = require("../../utils");
const Meteor = require("./Meteor");
const Powerup = require("./Powerup");
const Heart = require("./Heart");
const Star = require("./Star");
const IAEnemy = require("./IAEnemy");
const SocketService = require("../../services/SocketService");
// const RoomService = require("../../services/RoomService");

class Room {
    constructor({admin, name, time, width}) {
        this.admin = admin;
        this.name = name;
        this.isRunning = false;
        this.time = time;
        this.width = width;
        this.players = {};
        this.turrets = [];

        console.log("randomIntFromInterval", randomIntFromInterval);
    }

    isGameReady() {
        return !this.isRunning;
    }

    isAdmin(playerName) {
        return this.admin === playerName;
    }

    getPlayersList() {
        return Object.entries(this.players).map(([id, data]) => ({id, ...data}));
    }

    getRandomUser() {
        const players = this.getPlayersList();
        const randomIndex = randomIntFromInterval(0, players.length - 1);
        return players[randomIndex];
    }

    shootLaser(args) {
        SocketService.io.in(this.name).emit("shootLaser", args);
    }

    initGame(finishCallback) {
        this.isRunning = true;
        // Send to the users the real time, to manage in the client
        SocketService.io.in(this.name).emit("initTimmer", this.time);

        // send the current scores
        SocketService.io.in(this.name).emit("scoreUpdate", this.getScores());

        console.log("The game will finish in", this.time);
        // Calculate the finish of the game

        this.meteorInterval = setInterval(() => {
            if (randomIntFromInterval(0, 10) >= 3) {
                const meteor = new Meteor({
                    x: randomIntFromInterval(0, this.width),
                });
                SocketService.io.in(this.name).emit("renderMeteor", meteor);
            }
        }, 2000);

        this.IAInterval = setInterval(() => {
            if (this.turrets.length === 0) {
                const newTurret = new IAEnemy({room: this});
                this.turrets.push(newTurret);
                SocketService.io.in(this.name).emit("renderIAEnemy", newTurret);
            }
        }, 5000);

        SocketService.io.in(this.name).emit("renderIAEnemy", {
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
        });

        setTimeout(() => {
            console.log("We gonna finish the game", this.name);

            SocketService.io.in(this.name).emit("finishGame");
            this.clearIntervalMeteorInterval();
            // RoomService.removeARoom(this.name)
        }, this.time);

        // send the star object to the new player
        setTimeout(() => {
            SocketService.io.in(this.name).emit("starLocation", new Star());
            SocketService.io.in(this.name).emit("heartLocation", new Heart());
        }, 3000);

        // send the power up
        setTimeout(() => {
            const powerUp = new Powerup();
            SocketService.io.in(this.name).emit("renderPowerup", powerUp);
        }, 6000);
    }

    addPlayer(player) {
        this.players[player.playerName] = player;
    }

    /**
     *
     * @param playerName
     * @return {Player}
     */
    getPlayer(playerName) {
        return this.players[playerName];
    }

    getPlayerBysocket(socketId) {
        let user;
        Object.keys(this.players).forEach((playerName) => {
            const player = this.getPlayer(playerName);
            if (player.playerId === socketId) {
                user = player;
            }
        });
        return user;
    }

    removePlayer(playerName) {
        delete this.players[playerName];
    }

    /**
     *
     * @param updatedPlayer {Player}
     */
    updatePlayer(updatedPlayer) {
        this.players[updatedPlayer.playerName] = updatedPlayer
    }

    getScores() {
        return Object.keys(this.players).map((playerName) => {
            const {score, color} = this.players[playerName];
            return {playerName, score, color};
        });
    }

    hitPlayerWith({playerName, hitter}) {
        hitter.hit();
        const currentPlayer = hitter.hitted;
        if (currentPlayer.isDead()) {
            hitter.giveRewardsForTheKill(this);
            SocketService.io.to(this.name).emit("removePlayer", playerName);
            SocketService.io.emit("scoreUpdate", this.getScores());

            setTimeout(() => {
                currentPlayer.revive();
                SocketService.io.in(this.name).emit("revivePlayer", currentPlayer);
            }, 1500);
        } else {
            SocketService.io
                .in(this.name)
                .emit("updateHp", {playerName: playerName, hp: currentPlayer.hp});
        }
    }

    clearIntervalMeteorInterval() {
        clearInterval(this.meteorInterval);
    }

    isEmpty() {
        return Object.keys(this.players).length === 0;
    }

    toJson() {
        // eslint-disable-next-line no-unused-vars
        const {meteorInterval, io, ...response} = this;
        return response;
    }
}

module.exports = Room;
