var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chunk_size = 128;
var chunks = {};
var perlin_spectrum = [0, 0, 1, 2, 4, 8, 16, 32];
var perlin_constraints = new Array(perlin_spectrum.length);

function UniformRandomMatrix(size, max_value) {
    var matrix = [];
    for (var i = 0; i < size; ++i) {
	var row = [];
	for (var j = 0; j < size; ++j) {
	    var cell = Math.random() * max_value;
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
    // Generate a stack of random perlin matrices for the chunk.
    var chunk_constraints = [];
    var matrix_size = chunk_size;
    for (var layer = 0; layer < perlin_spectrum.length; ++layer) {
	var layer_matrix = UniformRandomMatrix(matrix_size,
					       perlin_spectrum[layer]);
	// Overwrite the local chunk contraints with the global perlin
	// constraints where they exist.
	
	matrix_size /= 2;
	chunk_constraints.push(layer_matrix);
    }
}

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('.'));

io.on('connection', function(socket){
    socket.on('get_chunk', function(chunk_info){
	var rle = [];
	for (var i = 0; i < chunk_size; ++i) {
	    rle.push(i);
	    rle.push(chunk_size - i);
	}
	chunk_info.rle = rle;
	socket.emit('chunk_data', chunk_info);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
