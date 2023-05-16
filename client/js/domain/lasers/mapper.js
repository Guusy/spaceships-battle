const map = {
    'default': { applyIn: () => { } },
    'slow': SlowLaser
}
window.laserMapper = (type) => {
    const laser = map[type]
    return laser || { applyIn: () => { } }
}