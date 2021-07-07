const express = require('express');
const app = express()

//set the template to ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))

//routes
app.get('/', (req, res) => {
    // res.send('Hello World!')
    res.render('index')
})

//Listen on port 8080
server = app.listen(8080)

//socket.io instantiation
// const io = require('socket.io')(server, {'transports': ['websocket', 'polling']})
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

//listen on every connection
io.on('connection', (socket) => {
    console.log('New User Connected!')

    //default username
    socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username
        console.log("Socket Username:", socket.username)
        console.log("Data Username:", data.username)
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        console.log("Message:", data.message)
        io.sockets.emit("new_message", { message: data.message, username: socket.username });
    })
})


