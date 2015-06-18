var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/client.js', function(req, res){
    res.sendFile(__dirname + '/client.js');
});

app.get('/favicon.ico', function(req, res){
    res.sendFile(__dirname + '/favicon.ico');
});

io.on('connection', function(socket){
    socket.on('get_chunk', function(chunk_info){
	console.log('get_chunk:');
	console.log(chunk_info);
	socket.emit('chunk_data', chunk_info);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
