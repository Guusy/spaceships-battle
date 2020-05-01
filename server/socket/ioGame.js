
const { removePlayer, randomIntFromInterval } = require('../utils')
const Room = require('../domain/game/Room')
const Player = require('../domain/game/Player')
const Star = require('../domain/game/Star')
const Powerup = require('../domain/game/Powerup')
const colors = ['0bed07', '200ee8', 'ed2009', 'db07eb', 'f56d05']

const rooms = {
    debug: new Room({
        name: 'debug',
        quantityPlayers: 1,
        time: 120000,
        width: 1000,
        colors
    }),
    d_m: new Room({
        name: 'd_m',
        quantityPlayers: 2,
        time: 60000,
        width: 1000,
        colors
    })
}

module.exports = (server) => {
    const io = require('socket.io').listen(server);
    io.on('connection', function (socket) {
        console.log('a user connected');

        // User create a game 
        socket.on('createGame', ({ room, quantityPlayers, time, width }) => {
            const qPlayers = Number.parseInt(quantityPlayers, 10)
            rooms[room] = new Room({
                name: room,
                quantityPlayers: qPlayers,
                time: Number.parseFloat(time, 10) * 60000,
                colors: colors.slice(0, qPlayers),
                width
            })
        })

        // User enter into the game
        socket.on('enterGame', ({ playerName, room }) => {
            // create a new player and add it to our players object
            const roomObject = rooms[room]
            console.log("EnterGame", playerName, 'room', roomObject, 'currentPlayers', roomObject.players)

            const newPlayer = new Player({
                playerName,
                room,
                playerId: socket.id,
                color: colors[randomIntFromInterval(0, colors.length - 1)],
            })

            roomObject.addPlayer(newPlayer);

            socket.join(room);

            // send the players object to the new player
            socket.emit('currentPlayers', roomObject.players);

            // update all other players of the new player
            socket.in(room).emit('newPlayer', newPlayer);

            if (roomObject.isGameReady()) {
                roomObject.initGame(io)
            }
        })

        socket.on('sendPing', (id) => {
            socket.emit('getPong', id)
        })

        socket.on('playerMovement', function ({ x, y, rotation, playerName, room }) {
            const roomObject = rooms[room]
            roomObject.updatePlayer(playerName, (player) => {
                player.x = x;
                player.y = y;
                player.rotation = rotation;
            })

            // emit a message to all players about the player that moved
            socket.to(room).emit('playerMoved', roomObject.getPlayer(playerName));
        });

        socket.on('shoot', function ({ room, lasers }) {
            socket.to(room).emit('playerShooted', { lasers });
        });

        socket.on('starCollected', function ({ playerName, room }) {
            const roomObject = rooms[room]
            roomObject.updatePlayer(playerName, (player) => {
                player.score += 15
            })
            const star = new Star()
            io.emit('starLocation', star);
            io.emit('scoreUpdate', roomObject.getScores());
        });

        socket.on('powerupCollected', function ({ playerName, room, powerup }) {
            const powerUp = new Powerup()
            socket.to(room).emit('powerupCollected', { playerName, powerup })
            io.in(room).emit('renderPowerup', powerUp);
        });

        socket.on('powerupActivated', function ({ playerName, room, powerup }) {
            socket.to(room).emit('powerupActivated', { playerName, powerup })
        });

        socket.on('killed', function ({ killer, playerName, room }) {
            // TODO
            // estrellas den 20  
            // kill 30 y restan 20
            // morir por meteoro 20
            const roomObject = rooms[room]

            if (killer) {
                roomObject.updatePlayer(killer, (player) => {
                    player.score += 20
                })
            }

            socket.to(room).emit('removePlayer', playerName)

            roomObject.updatePlayer(playerName, (player) => {
                const newScore = player.score - 20
                player.score = (newScore >= 0) ? newScore : 0
                player.x = Math.floor(Math.random() * 700) + 50
                player.y = Math.floor(Math.random() * 500) + 50
            })

            io.emit('scoreUpdate', roomObject.getScores());
            setTimeout(() => {
                io.in(room).emit('revivePlayer', roomObject.getPlayer(playerName));
            }, 1500)
        });



        // Disconnect action
        socket.on('disconnect', function () {
            console.log('user disconnected', socket.id);
            // remove this player from our players object
            // TODO: find in sockets
            removePlayer(rooms, socket.id)
            // const gameIsReady = allPlayersAreInTheRoom({ players, rooms, room })
            console.log('current rooms', rooms);
            // TODO: Check if a room is empty to clear the interval
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });

    });

    return {
        getRooms: () => rooms
    }
}