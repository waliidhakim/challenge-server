const mongoose = require('mongoose')
const createError = require('http-errors')
const http = require('http')
const UserMg = require('../db/mongo/models/userModel')
const GameMg = require('../db/mongo/models/gameModel')
const CardMg = require('../db/mongo/models/cardModel')
const HandMg = require('../db/mongo/models/handModel')

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected')
        socket.emit('connection', null)

        socket.on('playCard', async ({ gameId, playerId, cardId }) => {
            try {
                const id = gameId
                const userId = playerId
                const player = await UserMg.findById(userId)
                const game = await GameMg.findById(id).populate(
                    'discard currentCard'
                )
                if (!game) throw new Error('game not found')
                if (!game.players.includes(userId)) {
                    throw new Error('player not in game')
                }
                game.players.map((player, index) => {
                    if (player.toString() === userId) {
                        if (index !== game.turn) {
                            throw new Error('Not your turn')
                        }
                    }
                })
                const card = await CardMg.findById(cardId)
                if (
                    card.type !== 'number' &&
                    card.color !== game.currentCard.color &&
                    card.value !== game.currentCard.value
                ) {
                    throw new Error('Invalid card')
                }
                if (
                    (card.type === 'reverse' ||
                        card.type === 'skip' ||
                        card.type === 'draw2') &&
                    card.color !== game.currentCard.color
                ) {
                    throw new Error('Invalid card')
                }
                if (!card) throw new Error('card not found')
                const hand = await HandMg.findOne({
                    player: userId,
                    game: gameId,
                }).populate('cards')

                const cardInHand = hand.cards.find(
                    (c) => c._id.toString() === card._id.toString()
                )

                if (!cardInHand) {
                    throw new Error('card not in hand')
                }

                hand.cards = hand.cards.filter(
                    (c) => c._id.toString() !== card._id.toString()
                )

                game.discard.push(card)
                game.currentCard = card

                // If the card has a special effect, handle it
                // This is a simplified example - your actual implementation might be more complex
                if (card.type === 'skip') {
                    await skipTurn(game._id)
                }
                if (card.type === 'reverse') {
                    await reverseOrder(game._id)
                }
                if (card.type === 'draw2') {
                    const nextPlayer =
                        game.players[(game.turn + 1) % game.players.length]
                    await drawTwo(game._id, nextPlayer)
                }
                if (card.type === 'draw4') {
                    await drawFour(game._id, player._id, card.color)
                }
                if (card.type === 'wild') {
                    await changeColor(card.color, game._id)
                }
                if (card.type === 'number') {
                    await endTurn(player._id, game._id)
                }
                if (game.deck.length == 0) {
                    await shuffle(game._id)
                }

                // Save the changes
                await hand.save({ validateBeforeSave: false })
                await player.save({ validateBeforeSave: false })
                await game.save({ validateBeforeSave: false })

                socket.emit('playCardResponse', {
                    success: true,
                    message: 'Card played successfully',
                    card,
                })
            } catch (error) {
                socket.emit('playCardResponse', {
                    success: false,
                    message: error.message,
                })
            }
        })

        socket.on('drawCard', async ({ playerId, gameId }) => {
            try {
                drawCard(playerId, gameId)
                socket.emit('drawCardResponse', {
                    success: true,
                    message: 'Card drawn successfully',
                })
            } catch (error) {
                socket.emit('drawCardResponse', {
                    success: false,
                    message: error.message,
                })
            }
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected')
        })
    })
}

async function skipTurn(gameId) {
    const game = await GameMg.findById(gameId)
    game.turn = (game.turn + 2) % game.players.length
    await game.save()
}

async function reverseOrder(gameId) {
    const game = await GameMg.findById(gameId).populate('players')
    game.direction =
        game.direction === 'Clockwise' ? 'Counterclockwise' : 'Clockwise'
    game.players.reverse()
    await game.save({ validateBeforeSave: false })
}

async function drawTwo(gameId, playerId) {
    for (let i = 0; i < 2; i++) {
        await drawCard(playerId, gameId)
    }
}

async function drawFour(gameId, playerId, color) {
    for (let i = 0; i < 4; i++) {
        await drawCard(playerId, gameId)
    }
    changeColor(color, gameId)
}

async function changeColor(color, gameId) {
    const game = await GameMg.findById(gameId)
    game.currentCard.color = color
    await game.save()
}

async function drawCard(playerId, gameId) {
    try {
        const player = await UserMg.findById(playerId)
        const game = await GameMg.findById(gameId).populate('deck')
        const hand = await HandMg.findOne({
            player: playerId,
            game: gameId,
        }).populate('cards')

        const card = game.deck.pop()
        hand.cards.push(card)

        if (game.deck.length == 0) {
            await shuffle(game._id)
        }

        await player.save({ validateBeforeSave: false })
        await game.save()
        await hand.save()
    } catch (error) {
        console.log(error.message)
    }
}

async function endTurn(playerId, gameId) {
    const player = await UserMg.findById(playerId)
    console.log('🚀 ~ file: index.js:134 ~ endTurn ~ player:', player)
    const game = await GameMg.findById(gameId)
    const hand = await HandMg.findOne({
        player: playerId,
        game: gameId,
    }).populate('cards')

    // Check if the player has won the game
    if (hand.cards.length === 0) {
        endGame(playerId, gameId)
    } else {
        // Move to the next player
        game.turn = (game.turn + 1) % game.players.length
    }

    // Save the changes
    await game.save()
}

async function endGame(playerId, gameId) {
    const game = await GameMg.findById(gameId)
    game.players.map(async (player) => {
        await HandMg.findOneAndDelete({
            player: player,
            game: gameId,
        })
    })

    game.status = 'ended'
    game.winner = playerId

    await game.save()
}

async function shuffle(gameId) {
    const game = await GameMg.findById(gameId)
    if (!game) {
        return next(createError(404, 'game not found'))
    }
    try {
        const discard = game.discard.filter(
            (card) => card._id !== game.currentCard._id
        )
        discard.sort(() => Math.random() - 0.5)
        game.deck = discard
        game.discard = [game.currentCard]

        await game.save()
    } catch {
        console.log(error.message)
    }
}
