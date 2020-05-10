class SlowLaser {

    static applyIn(player) {
        player.slowVelocity(250)
        setTimeout(() => {
            player.restoreDefaultVelocity()
        }, 4000)
    }
}


window.SlowLaser = SlowLaser