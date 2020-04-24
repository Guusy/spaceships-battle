const _findBySocket = ({ players, socketId, callback }) => {
    Object.keys(players).forEach(room => {
        const roomData = players[room]
        Object.keys(roomData).forEach(player => {
            if (roomData[player].socketId === socketId) {
                callback({ player: players[room][player], room })
            }
        })
    })
}
const removePlayer = (players, socketId) => {
    Object.keys(players).forEach(room => {
        const roomData = players[room]
        Object.keys(roomData).forEach(player => {
            if (roomData[player].socketId === socketId) {
                delete players[room][player]
                console.log('we found it')
            }
        })
    })
}

const allPlayersAreInTheRoom = ({ players, rooms, room }) => {
    const roomPlayers = players[room]
    const roomData = rooms[room]
    const quantityPlayers = roomData.quantityPlayers
    const currentPlayers = Object.keys(roomPlayers).length

    return currentPlayers === quantityPlayers
}

const getRoomPlayer = () => {

}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
    removePlayer,
    randomIntFromInterval,
    allPlayersAreInTheRoom
}