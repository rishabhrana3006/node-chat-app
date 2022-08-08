const path = require('path') // this is core node js module
const http = require('http')
const express = require('express') // import express module
const Filter = require('bad-words') // import bad-words library
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const socketio = require('socket.io')
const app = express() // new constant app
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket Connection')

    socket.on('SendMessage', (Send_message, callback) => {

        const filter = new Filter()
        if (filter.isProfane(Send_message)) {
            return callback("Profanity is not allowed!")
        }
        // fetching user using socket.it
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, Send_message))
        callback()
    })

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            console.log(error)
            return callback(error)
        }
        socket.join(user.room)
        // rather than using io.emit,socket.broadcast.emit
        // we use inbuilt io.to.emit , socket.broadcast.to.emit to
        // emit in the only room we joined using socket.join

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    // broadcast emit used to broadcast message to everyone except the user
    // so if a new user joins, the io.on runs and once the server sends message to everyone except the new joiny

    // connect and disconnect event are already defined in socket io, we need to detect if a user disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {

            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has disconnected!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('send--location', (coords, callback) => {
        // fetching user using socket.it
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${coords[0]},${coords[1]}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})