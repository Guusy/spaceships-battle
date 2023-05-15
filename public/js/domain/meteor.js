
window.Meteor = class Meteor {

    static render(game, { id, x, y, scale, velocity }) {
        const meteor = game.meteors.create(x, y, 'meteor')
        meteor.setScale(scale)
        game.meteors.add(meteor)
        meteor.setData('id', id)
        meteor.body.velocity.y = velocity
    }
}