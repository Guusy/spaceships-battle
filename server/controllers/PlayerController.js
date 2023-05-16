const RoomService = require("../services/RoomService");
const SocketService = require("../services/SocketService");
const Star = require("../domain/game/Star");
const Heart = require("../domain/game/Heart");
const {getRoomAndPlayer} = require("./helpers");
const Powerup = require("../domain/game/Powerup");
const HitterMapper = require("../domain/game/hitters/HitterMapper");

class PlayerController {


    /**
     *
     * @param x
     * @param y
     * @param rotation
     * @param acceleration
     * @param velocity
     * @param maxSpeed
     * @param playerName
     * @param roomName
     */
    playerMovement({x, y, rotation, acceleration, velocity, maxSpeed, playerName, room: roomName}) {
        const room = RoomService.getRoom(roomName)
        // This if a player makes a movement when the game has already finish
        if (room) {
            const player = room.getPlayer(playerName)
            player.updatePosition({
                x, y, rotation, acceleration, velocity, maxSpeed
            })
            room.updatePlayer(player)
            // emit a message to all players about the player that moved
            SocketService.socket.to(room).emit('playerMoved', room.getPlayer(playerName));
        }
    }

    shoot({room, lasers}) {
        SocketService.socket.to(room).emit('playerShooted', {lasers});
    }

    collectStart({playerName, room: roomName}) {
        const {room, player} = getRoomAndPlayer({playerName, roomName})
        player.increaseScore(50)
        const star = new Star()
        SocketService.io.emit('starLocation', star);
        SocketService.io.emit('scoreUpdate', room.getScores());
    }

    collectHeart({playerName, room: roomName}) {
        const {room, player} = getRoomAndPlayer({playerName, roomName})

        const heart = new Heart()
        player.collect(heart)

        SocketService.io.emit('heartLocation', heart);
        SocketService.io.in(room.name).emit('updateHp', {playerName: playerName, hp: player.hp});
    }

    collectPowerUp({playerName, room, powerup}) {
        const powerUp = new Powerup()
        SocketService.socket.to(room).emit('powerupCollected', {playerName, powerup})
        SocketService.io.in(room).emit('renderPowerup', powerUp);
    }

    activatePowerUp({playerName, room, powerup}) {
        SocketService.socket.to(room).emit('powerupActivated', {playerName, powerup})
    }

    hit({hitted, hitter, hitterMetadata, room: roomName}) {
        //TODO: refactor this pls
        const {room, player} = getRoomAndPlayer({playerName: hitted.playerName, roomName})

        const currentHitter = HitterMapper(hitter, {hitter: hitterMetadata, hitted: player})
        if (!player.isDead()) {
            room.hitPlayerWith({playerName: hitted.playerName, hitter: currentHitter})
        }
    }
}

module.exports = new PlayerController()