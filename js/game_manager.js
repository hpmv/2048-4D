function GameManager(size, newTilesPerTurn, InputManager, Actuator, ScoreManager) {
  this.size = size.copy(); // Size of the grid
  this.grid = new Grid(this.size);
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator = new Actuator(this.size, this.grid);

  this.newTilesPerTurn = newTilesPerTurn;

  this.inputManager.on("move", function (arg) {
    this.move(arg[0], arg[1]);
  }.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {

  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.newTilesPerTurn; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate({
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated()
  });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (position, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[this.grid.positionToInt(tile.position)] = null;
  this.grid.cells[this.grid.positionToInt(cell)] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (dimension, sign) {
  // dimension is the dimension #
  // sign is either -1 or 1
  var self = this;
  var gameDimension = this.size.length;
  if (dimension < 0 || dimension >= gameDimension) return;
  if (sign != -1 && sign != 1) return;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector = this.getVector(dimension, sign);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  var traverseStart = Vector(gameDimension);
  var traverseIncrement = Vector(gameDimension);
  var traverseEnd = Vector(gameDimension);
  for (var i = 0; i < gameDimension; i++) {
    traverseIncrement[i] = 1;
    if (i == dimension) {
      traverseStart[i] = sign == 1 ? this.size[i] - 1 : 0;
      traverseIncrement[i] = sign == 1 ? -1 : 1;
    }
    traverseEnd[i] = traverseStart[i] + traverseIncrement[i] * this.size[i];
  }

  function visitCell(cell) {
    tile = self.grid.cellContent(cell);
    if (!tile) {
      return;
    }
    var positions = self.findFarthestPosition(cell, vector);
    var next = self.grid.cellContent(positions.next);

    // Only one merger per row traversal?
    if (next && next.value === tile.value && !next.mergedFrom) {
      var merged = new Tile(positions.next, tile.value * 2);
      merged.mergedFrom = [tile, next];

      self.grid.insertTile(merged);
      self.grid.removeTile(tile);

      // Converge the two tiles' positions
      tile.updatePosition(positions.next);

      // Update the score
      self.score += merged.value;

      // The mighty 2048 tile
      if (merged.value === 2048) self.won = true;
    } else {
      self.moveTile(tile, positions.farthest);
    }

    if (!cell.equals(tile.position)) {
      moved = true; // The tile moved from its original cell!
    }
  }

  var currentCell = Vector(gameDimension);

  function traverse(dim) {
    if (dim == gameDimension) {
      visitCell(currentCell);
    } else {
      for (currentCell[dim] = traverseStart[dim];
           currentCell[dim] != traverseEnd[dim];
           currentCell[dim] += traverseIncrement[dim]) {
        traverse(dim + 1);
      }
    }
  }

  traverse(0);

  if (moved) {
    for (var i = 0; i < this.newTilesPerTurn; i++) {
      this.addRandomTile();
    }

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (dimension, sign) {
  var result = Vector(this.size.length);
  result[dimension] = sign;
  return result;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell.copy();
    cell = previous.add(vector);
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;
  var result = false;
  self.grid.eachCell(function (cell, tile) {
    if (!tile) return false;
    for (var dimension = 0; dimension < self.size.length; dimension++) {
      for (var sign = -1; sign != 3; sign += 2) {
        var vector = self.getVector(dimension, sign);
        var otherCell = cell.add(vector);
        var otherTile = self.grid.cellContent(otherCell);
        if (otherTile && otherTile.value === tile.value) {
          result = true;
          return true;
        }
      }
    }
    return false;
  });

  return result;
};
