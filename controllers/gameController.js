const express = require('express')
const createError = require('http-errors')
const mongoose = require('mongoose')

const UserMg = require('../db/mongo/models/userModel')
const HandMg = require('../db/mongo/models/handModel')
const GameMg = require('../db/mongo/models/gameModel')
const CardMg = require('../db/mongo/models/cardModel')
const UserPg = require('../db/postGres/models/userPostgresModel')
const CardPg = require('../db/postGres/models/cardPostgresModel')
const GamePg = require('../db/postGres/models/gamePostgresModel')
const HandPg = require('../db/postGres/models/handPostgresModel')

getAll = async (req, res, next) => {
    try {
        const games = await GameMg.find({})
        res.send(games)
    } catch (error) {
        console.log(error.message)
    }
}

const create = async (req, res, next) => {
    const userId = req.user._id
    const { players } = req.body

    const user = await UserMg.findById(userId)
    if (!user) {
        return next(createError(404, 'user not found'))
    }
    if (user.games.length >= 5 && user.status == 'base') {
        return next(createError(400, 'game limit reached'))
    }

    try {
        let discard = []
        const deck = await CardMg.find({})
        const numberCards = await CardMg.find({ type: 'number' })
        const randomIndex = Math.floor(Math.random() * numberCards.length)
        const currentCard = numberCards[randomIndex]
        discard.push(currentCard)

        const game = await GameMg.create({
            players: [userId, ...players],
            owner: userId,
            deck: deck.filter(
                (card) => card._id.toString() !== currentCard._id.toString()
            ),
            discard: discard,
            currentCard: currentCard,
            status: 'waiting',
        })

        user.games.push(game._id)
        await user.save({ validateBeforeSave: false })
        res.send(game)
    } catch (error) {
        console.log(error.message)
    }
}

const startGame = async (req, res, next) => {
    const { id } = req.params
    const userId = req.user._id

    const user = await UserMg.findById(userId)
    if (!user) {
        return next(createError(404, 'user not found'))
    }
    const game = await GameMg.findById(id).populate('players')
    if (!game) {
        return next(createError(404, 'game not found'))
    }
    if (game.owner.toString() !== userId.toString()) {
        return next(createError(403, 'only the owner can start the game'))
    }
    if (game.status === 'ended') {
        return next(createError(400, 'game already ended'))
    }
    if (game.status === 'started') {
        return next(createError(400, 'game already started'))
    }

    try {
        game.status = 'started'
        game.turn = 0
        game.direction = 'clockwise'
        game.players = game.players.sort(() => Math.random() - 0.5)

        for (let i = 0; i < game.players.length; i++) {
            const player = await UserMg.findById(game.players[i])
            console.log(
                '🚀 ~ file: gameController.js:92 ~ startGame ~ player:',
                player
            )

            const hand = await HandMg.create({
                player: player._id,
                cards: [],
                game: game._id,
            })
            
            for (let j = 0; j < 7; j++) {
                const randomIndex = Math.floor(Math.random() * game.deck.length)
                console.log("🚀 ~ file: gameController.js:105 ~ startGame ~ randomIndex:", randomIndex)
                const card = game.deck[randomIndex]
                hand.cards.push(card)
                game.deck.splice(randomIndex, 1)
            }
            console.log("🚀 ~ file: gameController.js:102 ~ startGame ~ hand:", hand)
            await hand.save({ validateBeforeSave: false })
            await player.save({ validateBeforeSave: false })
        }
        await game.save({ validateBeforeSave: false })
        res.send(game)
    } catch (error) {
        console.error(error)
        return next(createError(500))
    }
}

module.exports = {
    getAll,
    create,
    startGame,
}
