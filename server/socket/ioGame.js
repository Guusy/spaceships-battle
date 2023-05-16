
const debugRoom = require('../debug/debugRooms')
const IOController = require('../controllers/IOController');
const SocketService = require('../services/SocketService');
/**
 * Returns a room.
 * @param {string} roomKey - the key of the room.
 * @returns {object} Room class
 */

module.exports = (server) => {

    SocketService.init(server)
    debugRoom.debug.io = SocketService.io // debug line
    debugRoom.d_m.io = SocketService.io // debug line
    SocketService.io.on('connection', IOController);

    return {
        getRooms: () => debugRoom
    }
}