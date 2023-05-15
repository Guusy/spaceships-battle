
const debugRoom = require('../debug/debugRooms')
const IOController = require('../services/IOController')
/**
 * Returns a room.
 * @param {string} roomKey - the key of the room.
 * @returns {object} Room class
 */

module.exports = (server) => {
    const io = require('socket.io').listen(server);
    debugRoom.debug.io = io // debug line
    debugRoom.d_m.io = io // debug line
    io.on('connection', IOController(io, debugRoom));

    return {
        getRooms: () => debugRoom
    }
}