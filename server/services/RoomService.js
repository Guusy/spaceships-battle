const rooms = require("../debug/debugRooms");
const {buildError} = require("../domain/errors");
const LoggerService = require('./LoggerService')

class RoomService {
    constructor() {
        this.rooms = rooms;
    }

    getRooms() {
        return this.rooms;
    }

    /**
     *
     * @param roomKey
     * @return {Room}
     */
    getRoom(roomKey) {
        console.log(this.rooms)
        const room = this.rooms[roomKey];
        if (!room) {
            LoggerService.error({
                message: `Could not find the room ${roomKey}`
            })
            return null
        }
        return room;
    }

    removeARoom(room) {
        delete this.rooms[room];
    }

    addRoom(room) {
        this.rooms[room.name] = room
    }
}

module.exports = new RoomService();
