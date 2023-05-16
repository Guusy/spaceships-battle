const RoomService = require("../services/RoomService");
const SocketService = require("../services/SocketService");

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
}

module.exports = new PlayerController()