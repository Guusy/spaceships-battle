const _findUserInRoomAnd = ({ rooms, socketId, callback }) => {
    Object.keys(rooms).forEach(roomKey => {
        const room = rooms[roomKey]
        if (room) {
            const user = room.getPlayerBysocket(socketId)
            if (user) {
                callback({ room, user })
            }
        }
    })
}
const removePlayer = (rooms, socketId) => {
    const callback = ({ room, user }) => {
        room.removePlayer(user.playerName)
    }
    _findUserInRoomAnd({ rooms, socketId, callback })
}

const getRoomBySocket = (rooms, socketId) => {
    let response
    const callback = ({ room }) => {
        response = room
    }
    _findUserInRoomAnd({ rooms, socketId, callback })

    return response
}
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const colors = ['0bed07', '200ee8', 'ed2009', 'db07eb', 'f56d05']




module.exports = {
    colors,
    removePlayer,
    getRoomBySocket,
    randomIntFromInterval,
}