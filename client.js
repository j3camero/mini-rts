var chunks = {};

function Key2D(i, j) {
    return i + ':' + j;
}

var socket = io();
socket.on('chunk_data', function(chunk_data) {
    console.log('chunk_data:');
    console.log(chunk_data);
    var chunk = new ClientChunk(chunk_data.chunk_i, chunk_data.chunk_j,
				chunk_data.rle);
    var canvas = document.getElementById('game_canvas');
    var context = canvas.getContext('2d');
    context.drawImage(chunk.canvas, 0, 0);
});
socket.emit('get_chunk', {'chunk_x': 5, 'chunk_y': 3});

function onload() {
    console.log('onload()');
};
