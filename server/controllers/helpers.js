const RoomService = require("../services/RoomService");
/**
 *
 * @param playerName
 * @param roomName
 * @return {{room: Room, player: Player}}
 */
const getRoomAndPlayer = ({playerName, roomName}) => {
    const room = RoomService.getRoom(roomName)
    const player = room.getPlayer(playerName)
    return {room, player}
}

module.exports = {
    getRoomAndPlayer
}