const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// POST /auth/signup
router.post('/signup', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' })
    }

    try {
        // Check if username already exists
        const existing = await User.findOne({ username })
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' })
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Save user
        const user = new User({ username, password: hashedPassword })
        await user.save()

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({ token, username: user.username })

    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// POST /auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' })
    }

    try {
        // Find user
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({ token, username: user.username })

    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router