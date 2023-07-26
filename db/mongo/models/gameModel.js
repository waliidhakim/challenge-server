const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let gameSchema = new Schema({
    players: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    turn: {
        type: Number,
        default: 0
    },
    direction: {
        type: String,
        enum: ['clockwise', 'counterclockwise'],
        default: 'clockwise'
    },
    deck: [{
        type: Schema.Types.ObjectId,
        ref: 'Card'
    }],
    discard: [{
        type: Schema.Types.ObjectId,
        ref: 'Card'
    }],
    currentCard: {
        type: Schema.Types.ObjectId,
        ref: 'Card'
    },
    status: {
        type: String,
        enum: ['waiting', 'started', 'ended'],
        default: 'waiting'
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
},
{
    timestamps: true,
}
)

module.exports = mongoose.model('Game', gameSchema);