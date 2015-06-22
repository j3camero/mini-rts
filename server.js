var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chunk_size = 128;
var chunks = {};
var perlin_spectrum = [0, 0, 1, 2, 4, 8, 16, 32];
var perlin_constraints = [];
for (var i = 0; i < perlin_spectrum.length; ++i) {
    perlin_constraints.push({});
}

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

function ChunkExists(i, j) {
    return Key2D(i, j) in chunks;
}

function LoadAndUpdateConstraints(target_matrix, i, j, layer, p) {
    var c = perlin_constraints[layer];
    // Look for adjacent chunks.
    var cn = ChunkExists(i, j-1);
    var cs = ChunkExists(i, j+1);
    var ce = ChunkExists(i+1, j);
    var cw = ChunkExists(i-1, j);
    var cne = ChunkExists(i+1, j-1);
    var cnw = ChunkExists(i-1, j-1);
    var cse = ChunkExists(i+1, j+1);
    var csw = ChunkExists(i-1, j+1);
    var ip = i * p;
    var jp = j * p;
    // North edge.
    if (cn) {
	for (var k = 1; k < p; ++k) {
	    var key = Key2D(ip+k,jp);
	    target_matrix[k][0] = c[key];
	    delete c[key];
	}
    } else {
	for (var k = 1; k < p; ++k) {
	    c[Key2D(ip+k,jp)] = target_matrix[k][0];
	}
    }
    // South edge.
    if (cs) {
	for (var k = 1; k < p; ++k) {
	    var key = Key2D(ip+k,jp+p);
	    target_matrix[k][p] = c[key];
	    delete c[key];
	}
    } else {
	for (var k = 1; k < p; ++k) {
	    c[Key2D(ip+k,jp+p)] = target_matrix[k][p];
	}
    }
    // West edge.
    if (cw) {
	for (var k = 1; k < p; ++k) {
	    var key = Key2D(ip,jp+k);
	    target_matrix[0][k] = c[key];
	    delete c[key];
	}
    } else {
	for (var k = 1; k < p; ++k) {
	    c[Key2D(ip,jp+k)] = target_matrix[0][k];
	}
    }
    // East edge.
    if (ce) {
	for (var k = 1; k < p; ++k) {
	    var key = Key2D(ip+p,jp+k);
	    target_matrix[p][k] = c[key];
	    delete c[key];
	}
    } else {
	for (var k = 1; k < p; ++k) {
	    c[Key2D(ip+p,jp+k)] = target_matrix[p][k];
	}
    }
    // North-east corner. (p,0)
    if (cn && ce && cne) {
	var key = Key2D(ip+p,jp);
	target_matrix[p][0] = c[key];
	delete c[key];
    } else if ((!cn) && (!ce) && (!cne)) {
	c[Key2D(ip+p,jp)] = target_matrix[p][0];
    } else {
	target_matrix[p][0] = c[Key2D(ip+p,jp)];
    }
    // South-east corner. (p,p)
    if (cs && ce && cse) {
	var key = Key2D(ip+p,jp+p);
	target_matrix[p][p] = c[key];
	delete c[key];
    } else if ((!cs) && (!ce) && (!cse)) {
	c[Key2D(ip+p,jp+p)] = target_matrix[p][p];
    } else {
	target_matrix[p][p] = c[Key2D(ip+p,jp+p)];
    }
    // North-west corner. (0,0)
    if (cn && cw && cnw) {
	var key = Key2D(ip,jp);
	target_matrix[0][0] = c[key];
	delete c[key];
    } else if ((!cn) && (!cw) && (!cnw)) {
	c[Key2D(ip,jp)] = target_matrix[0][0];
    } else {
	target_matrix[0][0] = c[Key2D(ip,jp)];
    }
    // South-west corner. (0,p)
    if (cs && cw && csw) {
	var key = Key2D(ip,jp+p);
	target_matrix[0][p] = c[key];
	delete c[key];
    } else if ((!cs) && (!cw) && (!csw)) {
	c[Key2D(ip,jp+p)] = target_matrix[0][p];
    } else {
	target_matrix[0][p] = c[Key2D(ip,jp+p)];
    }
} // LoadAndUpdateConstraints

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
	LoadAndUpdateConstraints(layer_matrix, i, j, layer, matrix_size - 1);
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
} // GenerateChunk

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
