const removePlayer = (players, scores, socketId) => {
    Object.keys(players).forEach(room => {
        const roomData = players[room]
        Object.keys(roomData).forEach(player => {
            if (roomData[player].socketId === socketId) {
                delete players[room][player]
                delete scores[player]
                console.log('we found it')
            }
        })
    })
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
    removePlayer,
    randomIntFromInterval
}