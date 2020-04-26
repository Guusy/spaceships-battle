const removePlayer = (rooms, socketId) => {
    Object.keys(rooms).forEach(roomKey => {
        const room = rooms[roomKey]
        if (room) {
            const user = room.getPlayerBysocket(socketId)
            if (user) {
                room.removePlayer(user.playerName)
                console.log('we found it')
            }
        }
    })
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
    removePlayer,
    randomIntFromInterval,
}