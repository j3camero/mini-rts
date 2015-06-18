console.log('Mini RTS client loaded!');
var socket = io();
socket.on('chunk_data', function(chunk_data) {
    console.log('chunk_data:');
    console.log(chunk_data);
});
socket.emit('get_chunk', {'chunk_x': 5, 'chunk_y': 3});
