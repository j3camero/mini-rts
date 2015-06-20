// Global constant. Must match the chunk sizes coming in from the server.
var chunk_size = 128;

function ClientChunk(chunk_i, chunk_j, rle) {
    this.chunk_i = chunk_i;
    this.chunk_j = chunk_j;
    this.terrain = [];
    var tile_type = false;
    for (var i = 0; i < rle.length; ++i) {
	var run_length = rle[i];
	for (var j = 0; j < run_length; ++j) {
	    this.terrain.push(tile_type);
	}
	tile_type = !tile_type;
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = chunk_size;
    this.canvas.height = chunk_size;
    var context = this.canvas.getContext('2d');
    context.fillStyle = 'rgb(0,0,196)';
    context.fillRect(0, 0, chunk_size, chunk_size);
    context.fillStyle = 'rgb(0,196,0)';
    for (var x = 0; x < chunk_size; ++x) {
	for (var y = 0; y < chunk_size; ++y) {
	    if (this.getTile(x, y)) {
		context.fillRect(x, y, 1, 1);
	    }
	}
    }
}

ClientChunk.prototype.getTile = function(x, y) {
    return this.terrain[y * chunk_size + x];
};
