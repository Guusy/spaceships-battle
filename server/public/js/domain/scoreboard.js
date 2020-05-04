window.ScoreBoard = class ScoreBoard {

    constructor(game, scores) {
        this.needsToUpdate = false
        this.scores = scores
        this.scoresTexts = []
        let scorePosition = 32
        this.scoresTexts = scores.map(aPlayer => {
            scorePosition += 16
            return game.add.text(24,
                scorePosition,
                aPlayer.playerName + ': ' + aPlayer.score,
                { fontSize: '18px', fill: `#${aPlayer.color}` });
        })
    }

    updateScores(newScores) {
        this.scores = newScores
        this.needsToUpdate = true
    }

    removeScore(playerName) {
        this.scores = this.scores.filter(score => score.playerName !== playerName)
        const last = this.scoresTexts.pop()
        last.destroy()
        this.needsToUpdate = true
        this.update()
    }

    update() {
        if (this.needsToUpdate) {
            this.getSortedScores().forEach((aPlayer, index) => {
                const text = this.scoresTexts[index]
                if (text) {
                    text.setText(`${index + 1}.${aPlayer.playerName} : ${aPlayer.score}`)
                    text.setColor(`#${aPlayer.color}`)
                }
            })
            this.needsToUpdate = false
        }
    }

    getSortedScores() {
        return this.scores.sort((playerA, playerB) => playerB.score - playerA.score)
    }
}