const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const authMiddleware = require('../middleware/auth')

// GET /messages/rooms — get list of active rooms
router.get('/rooms', authMiddleware, async (req, res) => {
    try {
        const rooms = await Message.distinct('room')
        res.json({ rooms })
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// GET /messages/:room — get messages for a room
router.get('/:room', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.room })
            .sort({ createdAt: 1 })
            .limit(50)
        res.json({ messages })
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router