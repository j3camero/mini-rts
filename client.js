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
    var key = Key2D(chunk_data.chunk_i, chunk_data.chunk_j);
    chunks[key] = chunk;
});

function GetChunk(i, j) {
    var key = Key2D(i, j);
    if (key in chunks) {
	return chunks[key];
    } else {
	chunks[key] = null;
	socket.emit('get_chunk', {'chunk_i': i, 'chunk_j': j});
	return null;
    }
}
var camera_x = 0;
var camera_y = 0;
var camera_angle = 0;
var tiles_per_pixel = 0.5;

function DoOneFrame() {
    var canvas = document.getElementById('game_canvas');
    var context = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    var pixel_radius = Math.max(canvas.width, canvas.height) / 2;
    var tile_radius = pixel_radius * tiles_per_pixel;
    var chunk_radius = Math.ceil(tile_radius / chunk_size);
    var camera_i = Math.floor(camera_x / chunk_size);
    var camera_j = Math.floor(camera_y / chunk_size);
    var r = chunk_radius;
    var pixels_per_tile = 1.0 / tiles_per_pixel;
    for (var i = camera_i - r; i <= camera_i + r; ++i) {
	for (var j = camera_j - r; j <= camera_j + r; ++j) {
	    var chunk = GetChunk(i, j);
	    if (!chunk) {
		continue;
	    }
	    var dx_tiles = i * chunk_size - camera_x;
	    var dy_tiles = j * chunk_size - camera_y;
	    var x = canvas.width / 2 + dx_tiles * pixels_per_tile;
	    var y = canvas.height / 2 + dy_tiles * pixels_per_tile;
	    var w = chunk_size * pixels_per_tile;
	    context.imageSmoothingEnabled = false;
	    context.drawImage(chunk.canvas, x, y, w, w);
	}
    }
    setTimeout(function(){ DoOneFrame() }, 100);
}

function onload() {
    onresize();
    DoOneFrame();
}

function onresize() {
    var canvas = document.getElementById('game_canvas');
    var context = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
