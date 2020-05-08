const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = process.env.PORT || 8081
const ioGame = require('./socket/ioGame')
const reload = require('reload');
const game = ioGame(server)

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


app.get('/rooms', (req, res) => {
  const rooms = { ...game.getRooms() }
  Object.keys(rooms).forEach(roomkey => {
    rooms[roomkey] = rooms[roomkey].toJson()
  })
  return res.status(200).json(rooms)
})

app.get('/rooms/:id', (req, res) => {
  const { id } = req.params
  const room = game.getRooms()[id]
  if (room) {
    // eslint-disable-next-line no-unused-vars
    return res.status(200).json(room.toJson())
  }
  return res.status(404).json({ message: 'This room does not exists' })
})

server.listen(port, function () {
  console.log(`Listening on ${server.address().port}`);
});

reload(app);