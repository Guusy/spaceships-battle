const Meteor = require('./Meteor')
const Laser = require('./Laser')

const hitters = {
    'meteor': Meteor,
    'laser': Laser
}

module.exports = (key, data) => {
    const Hitter = hitters[key]
    if (Hitter) {
        return new Hitter(data)
    } else {
        console.error('This hitter doesnt exists')
    }
}