var express = require("express");
var app     = express();
var server  = require("http").Server(app);
var io      = require("socket.io")(server);


app.use(express.static(__dirname + "/node_modules"));

app.get("/", function(req, res, next) {
    res.sendFile(__dirname + "/public/index.html");
});

io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
    });
    client.emit('messages', 'Hello from server');
});

server.listen(4200, function() {
  console.log("Servidor corriendo puerto: 4200");
});
