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

    socket.on('createGame', GameController.createGame)

    socket.on('initGame', GameController.initGame)

    socket.on('playerMovement', PlayerController.playerMovement);

    // User enter into the game
    socket.on('enterGame', ({playerName, room}) => {
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


    socket.on('sendPing', (id) => {
        socket.emit('getPong', id)
    })


    socket.on('shoot', function ({room, lasers}) {
        socket.to(room).emit('playerShooted', {lasers});
    });

    socket.on('starCollected', function ({playerName, room}) {
        const roomObject = RoomService.getRoom(room)
        roomObject.updatePlayer(playerName, (player) => {
            player.score += 50
        })
        const star = new Star()
        io.emit('starLocation', star);
        io.emit('scoreUpdate', roomObject.getScores());
    });

    socket.on('heartCollected', function ({playerName, room}) {
        const roomObject = RoomService.getRoom(room)
        const currentPlayer = roomObject.getPlayer(playerName)
        const heart = new Heart()
        currentPlayer.collect(heart)

        io.emit('heartLocation', heart);
        io.in(room).emit('updateHp', {playerName: playerName, hp: currentPlayer.hp});
    });

    socket.on('powerupCollected', function ({playerName, room, powerup}) {
        const powerUp = new Powerup()
        socket.to(room).emit('powerupCollected', {playerName, powerup})
        io.in(room).emit('renderPowerup', powerUp);
    });

    socket.on('powerupActivated', function ({playerName, room, powerup}) {
        socket.to(room).emit('powerupActivated', {playerName, powerup})
    });

    socket.on('playerHitted', ({hitted, hitter, hitterMetadata, room}) => {
        const currentRoom = RoomService.getRoom(room)
        const currentPlayer = currentRoom.getPlayer(hitted.playerName)
        const currentHitter = HitterMapper(hitter, {hitter: hitterMetadata, hitted: currentPlayer})
        if (!currentPlayer.isDead()) {
            currentRoom.hitPlayerWith({playerName: hitted.playerName, hitter: currentHitter})
        }
    })

    // Disconnect action
    socket.on('disconnect', function () {
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