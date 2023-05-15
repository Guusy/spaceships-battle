const Room = require("../domain/game/Room");
const rooms = {
    debug: new Room({
        name: 'debug',
        admin: 'gonzalo',
        time: 320000,
        width: 1000,
        colors: []
    }),
    d_m: new Room({
        name: 'd_m',
        admin: 'gonzalo',
        quantityPlayers: 2,
        time: 320000,
        width: 1000,
        colors: []
    })
}

module.exports = rooms