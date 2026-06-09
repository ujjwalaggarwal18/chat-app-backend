const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()
const authRoutes = require('./routes/auth')
const messageRoutes = require('./routes/messages')
const Message = require('./models/Message')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'https://chat-app-frontend-beta-neon.vercel.app',
        methods: ['GET', 'POST']
    }
})

app.use(cors({
    origin: 'https://chat-app-frontend-beta-neon.vercel.app'
}))
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('DB error:', err))

app.get('/', (req, res) => {
    res.send('Chat app backend running!')
})

app.use('/auth', authRoutes)
app.use('/messages', messageRoutes)

// Socket.io logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('joinRoom', async ({ room, username }) => {
        socket.join(room)
        console.log(`${username} joined room: ${room}`)

        const messages = await Message.find({ room })
            .sort({ createdAt: 1 })
            .limit(50)

        socket.emit('messageHistory', messages)
        socket.to(room).emit('userJoined', { username })
    })

    socket.on('sendMessage', async ({ room, username, text }) => {
        const message = new Message({ room, username, text })
        await message.save()

        io.to(room).emit('message', {
            username,
            text,
            createdAt: message.createdAt
        })
    })

    socket.on('leaveRoom', ({ room, username }) => {
        socket.leave(room)
        socket.to(room).emit('userLeft', { username })
        console.log(`${username} left room: ${room}`)
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = { app, io }