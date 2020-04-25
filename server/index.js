var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
const { removePlayer, randomIntFromInterval, allPlayersAreInTheRoom } = require('./utils')
const port = process.env.PORT || 8081
var players = {};
const colors = ['0bed07', '200ee8', 'ed2009', 'db07eb', 'f56d05']
const powerups = require('./domain/powerups')

const rooms = {
  debug: {
    quantityPlayers: 1,
    time: 120000,
    width: 1000,
    colors
  },
  d_m: {
    quantityPlayers: 2,
    time: 60000,
    width: 1000,
    colors
  }
}


app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const getScores = (room) => {
  const roomPlayers = players[room]
  return Object.keys(roomPlayers).map(playerName => {
    const { score, color } = roomPlayers[playerName]
    return { playerName, score, color }
  })
}

const createStar = () => ({
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
})

const createPowerup = () => {
  const randomPowerUp = powerups[randomIntFromInterval(0, powerups.length - 1)]
  return { ...createStar(), ...randomPowerUp }
}

io.on('connection', function (socket) {
  console.log('a user connected');

  // User create a game 
  socket.on('createGame', ({ room, quantityPlayers, time, width }) => {
    const qPlayers = Number.parseInt(quantityPlayers, 10)
    rooms[room] = {
      quantityPlayers: qPlayers,
      time: Number.parseFloat(time, 10) * 60000,
      colors: colors.slice(0, qPlayers),
      isRunning: false,
      width
    }
  })

  // User enter into the game
  socket.on('enterGame', ({ playerName, room }) => {
    // create a new player and add it to our players object
    console.log("EnterGame", playerName, room, 'room', rooms, 'currentPlayers', players)
    const roomData = rooms[room]
    players[room] = players[room] ? players[room] : {}

    players[room][playerName] = {
      socketId: socket.id,
      playerName,
      room,
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      color: roomData.colors.shift(),
      score: 0
    };

    socket.join(room);

    const roomPlayers = players[room]
    // send the players object to the new player
    socket.emit('currentPlayers', roomPlayers);

    // update all other players of the new player
    socket.in(room).emit('newPlayer', roomPlayers[playerName]);

    const gameIsReady = allPlayersAreInTheRoom({ players, rooms, room })
    if (gameIsReady && !roomData.isRunning) {
      rooms[room].isRunning = true
      const time = roomData.time
      // Send to the users the real time, to manage in the client
      io.in(room).emit('initTimmer', time);

      // send the current scores
      io.in(room).emit('scoreUpdate', getScores(room));

      console.log('The game will finish in', time)
      // Calculate the finish of the game

      rooms[room].meteorInterval = setInterval(() => {
        if (randomIntFromInterval(0, 10) >= 3) {
          const meteor = {
            x: randomIntFromInterval(0, roomData.width),
            y: 0,
            scale: (randomIntFromInterval(10, 20) * 0.1),
            velocity: randomIntFromInterval(50, 100)
          }
          io.in(room).emit('renderMeteor', meteor)
        }
      }, 2000)

      setTimeout(() => {
        console.log("We gonna finish the game")
        io.in(room).emit('finishGame');
        clearInterval(rooms[room].meteorInterval)
        delete rooms[room]
      }, time)

      // send the star object to the new player
      setTimeout(() => {
        io.in(room).emit('starLocation', createStar());
      }, 3000)

      // send the power up 
      setTimeout(() => {
        const powerUp = createPowerup()
        io.in(room).emit('renderPowerup', powerUp); //TODO:  make random powerup
      }, 6000)
    }
  })

  socket.on('sendPing', (id) => {
    socket.emit('getPong', id)
  })

  socket.on('playerMovement', function ({ x, y, rotation, playerName, room }) {
    players[room][playerName].x = x;
    players[room][playerName].y = y;
    players[room][playerName].rotation = rotation;
    // emit a message to all players about the player that moved
    socket.to(room).emit('playerMoved', players[room][playerName]);
  });

  socket.on('shoot', function ({ room, lasers }) {
    socket.to(room).emit('playerShooted', { lasers });
  });

  socket.on('starCollected', function ({ playerName, room }) {
    players[room][playerName].score += 10
    const star = createStar()
    io.emit('starLocation', star);
    io.emit('scoreUpdate', getScores(room));
  });

  socket.on('powerupCollected', function ({ playerName, room, powerup }) {
    const powerUp = createPowerup()
    socket.to(room).emit('powerupCollected', { playerName, powerup })
    io.in(room).emit('renderPowerup', powerUp); //TODO:  make random powerup
  });

  socket.on('powerupActivated', function ({ playerName, room, powerup }) {
    socket.to(room).emit('powerupActivated', { playerName, powerup })
  });

  socket.on('killed', function ({ killer, playerName, room }) {
    if (killer) {
      players[room][killer].score += 20
    }

    socket.to(room).emit('removePlayer', playerName)

    const newScore = players[room][playerName].score - 20
    players[room][playerName].score = (newScore >= 0) ? newScore : 0
    players[room][playerName].x = Math.floor(Math.random() * 700) + 50
    players[room][playerName].y = Math.floor(Math.random() * 500) + 50
    io.emit('scoreUpdate', getScores(room));
    setTimeout(() => {
      io.in(room).emit('revivePlayer', players[room][playerName]);
    }, 1500)
  });



  // Disconnect action
  socket.on('disconnect', function () {
    console.log('user disconnected', players, socket.id);
    // remove this player from our players object
    // TODO: find in sockets
    removePlayer(players, socket.id)
    // const gameIsReady = allPlayersAreInTheRoom({ players, rooms, room })

    console.log('current players', players);
    // TODO: Check if a room is empty to clear the interval
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

});

server.listen(port, function () {
  console.log(`Listening on ${server.address().port}`);
});