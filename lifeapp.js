	
var LifeApp = LifeApp || {};

var grid_defaults = {width:0, height:0, grid_color:'gray', cell_color:'black', background:'white', margin:0, cell_size:10};

function Grid(options) {
	this.options = $.extend({}, grid_defaults, options);
}

Grid.prototype.draw = function(viewport_width, viewport_height, context, cells) {

	var gridPixelSize = this.options.cell_size;

	context.save();
	context.fillStyle = this.options.background;
	context.fillRect(0, 0, viewport_width, viewport_height);
	
	// draw grid
	context.lineWidth = 0.50;
	context.strokeStyle = this.options.grid_color;
	context.fillStyle = this.options.cell_color;
	
	// horizontal grid lines
	for(var i = this.options.margin; i <= viewport_height; i = i + gridPixelSize) {
		context.beginPath();
		context.moveTo(0, i);
		context.lineTo(viewport_width, i);
		context.closePath();
		context.stroke();
	}
	
	// vertical grid lines
	for(var j = 0; j <= viewport_width; j = j + gridPixelSize)	{
		context.beginPath();
		context.moveTo(j, this.options.margin);
		context.lineTo(j, viewport_height);
		context.closePath();
		context.stroke();
	}
	
	for( var i=0; i < cells.length; i++) {
		
		var cellX = i % this.options.width;
		var cellY = parseInt(i / this.options.width);
	
		var offsetX = cellX * CELL_SIZE + 1;
		var offsetY = cellY * CELL_SIZE + 1;
	
		if (cells[i].state == CELLSTATE_ALIVE) {
			context.fillRect(offsetX, offsetY + this.options.margin, CELL_SIZE - 2, CELL_SIZE - 2);
		}
	}
	
	context.restore();			
};

LifeApp.CellStateEnum = {
	DEAD: 0,
	ALIVE: 1
};

LifeApp.GameStateEnum = {
	GAME_STATE_INIT: 0,
	GAME_STATE_WAIT_FOR_INPUT: 1,
	GAME_STATE_PLAYING: 2,
	GAME_STATE_PAUSED: 3
};

LifeApp.defaults = {
	canvas_width:0, 
	canvas_height:0, 
	board_width:0, 
	board_height:0,
	margin:0,
	grid_color:'gray', 
	cell_color:'black',
	background:'white',
	cell_size:10
};

LifeApp.life = function (canvas, options) {

	// private methods
	var state_init = function() {

		this.generation = 0;
		this.cells = new Array(this.options.board_width * this.options.board_height);
		
		for(var i=0; i<this.cells.length;i++) {
			this.cells[i] = {state: LifeApp.CellStateEnum.DEAD};
		}
		
		this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_WAIT_FOR_INPUT);
	};
	
	var state_waitForInput = function() {
		this.calcNeighborhood(this);
	};
	
	var state_playGame = function() {
		
		this.calcNeighborhood(this);
		this.generation++;

		for(var i = 0; i < this.cells.length; i++) {
			if(this.neighbors[i] > 3 || this.neighbors[i] < 2) {
				// it dies of over population or under population
				this.cells[i].state = LifeApp.CellStateEnum.DEAD; 
			} else if(this.neighbors[i] == 3) {
				// birth one
				this.cells[i].state = LifeApp.CellStateEnum.ALIVE;
			} // otherwise it doesn't change state (if it was dead it stays dead, if it was alive it stays alive)
		}
	};
	
	this.switchGameState = function(state) {
		this.previousState = this.currentState;
		switch(state) {
		case LifeApp.GameStateEnum.GAME_STATE_INIT:
			this.currentGameStateFunction = state_init;
			break;
		case LifeApp.GameStateEnum.GAME_STATE_WAIT_FOR_INPUT:
			this.currentGameStateFunction = state_waitForInput;
			break;
		case LifeApp.GameStateEnum.GAME_STATE_PLAYING:
			this.currentGameStateFunction = state_playGame;
			break;
		case LifeApp.GameStateEnum.GAME_STATE_PAUSED:
			this.currentGameStateFunction = state_waitForInput;
			break;
		}
		this.currentState = state;
	};
	
	this.calcNeighborhood = function() {
		
		// build array of neighbors
		this.neighbors = [];
		
		var _width = this.options.board_width;
		var _height = this.options.board_height;
		
		var i = _width;
		while (i--)
		{
			var j = _height;
			while (j--)
			{
				value = 0;

				upper = j == _height - 1 ? 0 : j + 1;
				lower = j == 0 ? _height - 1 : j - 1;

				row = (i == 0 ? _width - 1 : (i - 1));
				
				if (this.getCell(row,lower).state == LifeApp.CellStateEnum.ALIVE) ++value;
				if (this.getCell(row,j).state == LifeApp.CellStateEnum.ALIVE) ++value;
				if (this.getCell(row, upper).state == LifeApp.CellStateEnum.ALIVE) ++value;

				row = i == _width - 1 ? 0 : (i + 1);
				if (this.getCell(row, lower).state == LifeApp.CellStateEnum.ALIVE) ++value;
				if (this.getCell(row, j).state == LifeApp.CellStateEnum.ALIVE) ++value;
				if (this.getCell(row, upper).state == LifeApp.CellStateEnum.ALIVE) ++value;

				row = i;
				if (this.getCell(row,lower).state == LifeApp.CellStateEnum.ALIVE) ++value;
				if (this.getCell(row,upper).state == LifeApp.CellStateEnum.ALIVE) ++value;

				this.setNeighbors(row, j, value);
			}
		}
	};		
	
	// protected methods
	this.getNeighbors = function(cellX, cellY) {
		var index = cellX + cellY * this.options.board_width;
		return this.neighbors[index];
	};
	
	this.setNeighbors = function(cellX, cellY, value) {
		var index = cellX + cellY * this.options.board_width;
		this.neighbors[index] = value;
	};
	
	this.setCell = function(cellX, cellY, state) {
		var index = cellX + cellY * this.options.board_width;
		this.cells[index].state = state;
	};
	
	this.getCell = function(cellX, cellY) {
		var index = cellX + cellY * this.options.board_width;
		return this.cells[index];
	};
	
	this.options = $.extend({}, LifeApp.defaults, options);
	
	this.canvas = canvas;
	this.context = this.canvas.get(0).getContext("2d");
	
	this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_INIT);
};

LifeApp.life.prototype.update = function() {
	this.currentGameStateFunction.apply(this);
};

LifeApp.life.prototype.draw = function() {

	//var canvas = this.canvas.get(0);
	//var context = this.context;
	
	//var grid = new Grid({height:this.options.board_height, width:this.options.board_width, cell_color:this.options.cell_color, grid_color:this.options.grid_color});
	//grid.draw(canvas.width, canvas.height, context, this.cells);		

	var gridPixelSize = this.options.cell_size;
	var canvas = this.canvas.get(0);
	var context = this.context;

	context.save();
	context.fillStyle = this.options.background;
	context.fillRect(0, 0, canvas.width, canvas.height);

   // draw grid
	context.lineWidth = 0.50;
	context.strokeStyle = this.options.grid_color;
	context.fillStyle = this.options.cell_color;

	var gridHeight = this.options.board_height * this.options.cell_size;
	var gridWidth = this.options.board_width * this.options.cell_size;
	
	// horizontal grid lines
	for(var i = this.options.margin; i <= gridHeight + this.options.margin; i = i + gridPixelSize) {
		context.beginPath();
		context.moveTo(0, i);
		context.lineTo(gridWidth, i);
		context.closePath();
		context.stroke();
	}

	// vertical grid lines
	for(var j = 0; j <= gridWidth; j = j + gridPixelSize)	{
		context.beginPath();
		context.moveTo(j, this.options.margin);
		context.lineTo(j, gridHeight + this.options.margin);
		context.closePath();
		context.stroke();
	}

	// draw cells
	for( var i=0; i < this.cells.length; i++) {
		
		var cellX = i % this.options.board_width;
		var cellY = parseInt(i / this.options.board_width);
	
		var offsetX = cellX * this.options.cell_size + 1;
		var offsetY = cellY * this.options.cell_size + 1;
	
		if (this.cells[i].state == LifeApp.CellStateEnum.ALIVE) {
			context.fillRect(offsetX, offsetY + this.options.margin, this.options.cell_size - 2, this.options.cell_size - 2);
		}
	}

	context.restore();			
};

LifeApp.life.prototype.getCellInfoFromScreen = function(screenX, screenY) {
	
	var cellX = parseInt(screenX / this.options.cell_size);
	var cellY = parseInt((screenY - this.options.margin) / this.options.cell_size);

	// if in bounds, show info
	if( cellX >= 0 && cellY >= 0 && cellX < this.options.board_width && cellY < this.options.board_height ) {
		
		var cell = this.getCell(cellX, cellY);
		
		if( cell !== undefined ) {
			return { cell:cell, x:cellX, y:cellY, neighbors:this.getNeighbors(cellX, cellY) };
		}
	}
	
	return false;
};

LifeApp.life.prototype.getGenerationCount = function() {
	return this.generation;
};

LifeApp.life.prototype.getPopulationCount = function() {
	
	var total = 0;
	$.each(this.cells, function() {
		
		if( this.state == LifeApp.CellStateEnum.ALIVE )
	    	total ++;
	});
	
	return total;
};

LifeApp.life.prototype.singleStep = function() {
	this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_PLAYING);
	this.update();
	this.draw();
	this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_PAUSED);
};

LifeApp.life.prototype.reset = function() {
	this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_INIT);		
};

LifeApp.life.prototype.run = function() {
	if( this.currentState == LifeApp.GameStateEnum.GAME_STATE_PAUSED || this.currentState == LifeApp.GameStateEnum.GAME_STATE_WAIT_FOR_INPUT ) {
		this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_PLAYING);
	}
};

LifeApp.life.prototype.isPlaying = function() {
	return this.currentState == LifeApp.GameStateEnum.GAME_STATE_PLAYING;	
};

LifeApp.life.prototype.pause = function() {
	
	if( this.currentState == LifeApp.GameStateEnum.GAME_STATE_PLAYING ) {
		this.switchGameState(LifeApp.GameStateEnum.GAME_STATE_PAUSED);
	}
};

LifeApp.life.prototype.option = function(option, value) {
	
	if( typeof(option) === 'string' ) {
		
		if( value !== undefined ) {
			this.options[option] = value;
		} else {
			return this.options[option];
		}
		
	} else if(typeof(option) === 'object') {
		
		//var options = option;
		
		// merge with our options
		this.options = $.extend({}, option, this.options);
	}
};

	