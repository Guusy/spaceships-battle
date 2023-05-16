const Room = require("../domain/game/Room");
const LoggerService = require("../services/LoggerService");
const RoomService = require("../services/RoomService");
const {randomIntFromInterval} = require("../utils");
const Player = require("../domain/game/Player");

class GameController {
    constructor() {
        this.colors = ["0bed07", "200ee8", "ed2009", "db07eb", "f56d05"];
    }

    /**
     *
     * @return {string} A color
     */
    getRandomColor() {
        return this.colors[randomIntFromInterval(0, this.colors.length - 1)];
    }

    /**
     *
     * @param room
     * @param time
     * @param admin
     * @param width
     */
    createGame({room, time, admin, width}) {
        const roomObject = new Room({
            name: room,
            admin,
            time: Number.parseFloat(time) * 60000,
            width,
        });
        RoomService.addRoom(roomObject);

        LoggerService.event({
            event: "GAME_CREATED",
            metaData: {
                room: roomObject,
            },
        });
    }

    /**
     *
     * @param playerName
     * @param roomName
     * @param socket
     * @return {{roomObject: Room, newPlayer: Player}}
     */
    enterGame({playerName, roomName, socket}) {
        const roomObject = RoomService.getRoom(roomName);

        const newPlayer = new Player({
            playerName,
            room: roomName,
            playerId: socket.id,
            color: this.getRandomColor(),
        });

        roomObject.addPlayer(newPlayer);
        return {newPlayer, roomObject};
    }

    initGame({room, playerName}) {
        const currentRoom = RoomService.getRoom(room)
        if (currentRoom.isGameReady() && currentRoom.isAdmin(playerName)) {
            currentRoom.initGame()
        }
    }
}

module.exports = new GameController();
