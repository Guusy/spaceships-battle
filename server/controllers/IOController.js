const Player = require("../domain/game/Player");
const {randomIntFromInterval, getRoomBySocket, removePlayer, colors} = require("../utils");
const Star = require("../domain/game/Star");
const Heart = require("../domain/game/Heart");
const Powerup = require("../domain/game/Powerup");
const HitterMapper = require("../domain/game/hitters/HitterMapper");
const SocketService = require("../services/SocketService");
const GameController = require("./GameController");
const PlayerController = require("./PlayerController");
const RoomService = require("../services/RoomService");


module.exports = (socket) => {
    console.log('a user connected');
    const {io} = SocketService
    SocketService.addSocket(socket)

    // Games routes
    socket.on('createGame', GameController.createGame)

    socket.on('initGame', GameController.initGame)

    // User enter into the game
    socket.on('enterGame', ({playerName, room}) => {
        //TODO: why i cant refactor this, related to `this` inside the class
        // create a new player and add it to our players object
        const {newPlayer, roomObject} = GameController.enterGame({
            playerName,
            roomName: room,
            socket
        })

        socket.join(room);

        // send the players object to the new player
        socket.emit('currentPlayers', roomObject.players);

        // update all other players of the new player
        socket.in(room).emit('newPlayer', newPlayer);
    })

    // Player routes
    socket.on('playerMovement', PlayerController.playerMovement);
    socket.on('shoot', PlayerController.shoot);
    socket.on('starCollected', PlayerController.collectStart);
    socket.on('heartCollected', PlayerController.collectHeart);
    socket.on('powerupCollected', PlayerController.collectPowerUp);
    socket.on('powerupActivated', PlayerController.activatePowerUp);
    socket.on('playerHitted', PlayerController.hit)




    // Helpers routes
    socket.on('sendPing', (id) => {
        socket.emit('getPong', id)
    })








    // Disconnect action
    socket.on('disconnect', function () {
        //TODO: move to controller
        console.log('user disconnected', socket.id);
        // remove this player from our players object
        //TODO: refactor this logic of rooms
        const rooms = RoomService.getRooms()
        const currentRoom = getRoomBySocket(rooms, socket.id)
        removePlayer(rooms, socket.id)
        if (currentRoom) {
            if (currentRoom.isEmpty()) {
                currentRoom.clearIntervalMeteorInterval()
                RoomService.removeARoom(currentRoom.name)
            } else {
                // emit a message to all players to remove this player
                io.in(currentRoom.name).emit('disconnect', socket.id);
            }
        }
    });

}