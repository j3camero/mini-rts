var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chunk_size = 128;
var chunks = {};
var perlin_spectrum = [0, 0, 1, 2, 4, 8, 16, 32];
var perlin_constraints = new Array(perlin_spectrum.length);

function ZeroMatrix(size) {
    var matrix = [];
    for (var i = 0; i < size; ++i) {
	var row = [];
	for (var j = 0; j < size; ++j) {
	    row.push(0);
	}
	matrix.push(row);
    }
    return matrix;
}

function UniformRandomMatrix(size, max_value) {
    var matrix = [];
    for (var i = 0; i < size; ++i) {
	var row = [];
	for (var j = 0; j < size; ++j) {
	    var cell = (Math.random() * 2 - 1) * max_value;
	    row.push(cell);
	}
	matrix.push(row);
    }
    return matrix;
}

function Key2D(x, y) {
    return x + ':' + y;
}

function LoadConstraint(layer, i, j, x, y, remove, replacement) {
    // Calculate abs x,y
    var abs_x = i * chunk_size + x;
    var abs_y = j * chunk_size + j;
    var key = Key2D(abs_x, abs_y);
    var cons = perlin_constraints[layer];
    if (key in cons) {
	var val = cons[key];
	if (remove) {
	    delete cons[key];
	}
	return val;
    } else {
	return null;
    }
}

function GenerateChunk(i, j) {
    var terrain = ZeroMatrix(chunk_size);
    for (var layer = 0; layer < perlin_spectrum.length; ++layer) {
	var magnitude = perlin_spectrum[layer];
	if (magnitude < 0.0001) {
	    continue;
	}
	var resolution = Math.pow(2, layer);
	var matrix_size = chunk_size / resolution + 1;
	var layer_matrix = UniformRandomMatrix(matrix_size, magnitude);
	for (var x = 0; x < chunk_size; ++x) {
	    var mx = Math.floor(x / resolution);
	    var h = (x % resolution) / resolution;
	    for (var y = 0; y < chunk_size; ++y) {
		var my = Math.floor(y / resolution);
		var v = (y % resolution) / resolution;
		terrain[x][y] += (layer_matrix[mx][my] * (1-h) * (1-v) +
				  layer_matrix[mx+1][my] * h * (1-v) +
				  layer_matrix[mx][my+1] * (1-h) * v +
				  layer_matrix[mx+1][my+1] * h * v);
	    }
	}
    }
    var tiles = [];
    var rle = [];
    var rle_count = 0;
    var rle_state = false;
    for (var y = 0; y < chunk_size; ++y) {
	for (var x = 0; x < chunk_size; ++x) {
	    var tile = terrain[x][y] > 0;
	    tiles.push(tile);
	    if (tile != rle_state) {
		rle.push(rle_count);
		rle_count = 0;
		rle_state = !rle_state;
	    }
	    ++rle_count;
	}
    }
    rle.push(rle_count);
    return {tiles: tiles, rle: rle};
}

function GetChunk(i, j) {
    var key = Key2D(i, j);
    if (!(key in chunks)) {
	chunks[key] = GenerateChunk(i, j);
    }
    return chunks[key];
}

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('.'));

io.on('connection', function(socket){
    socket.on('get_chunk', function(chunk_info){
	var chunk = GetChunk(chunk_info.chunk_i, chunk_info.chunk_j);
	chunk_info.rle = chunk.rle;
	socket.emit('chunk_data', chunk_info);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
