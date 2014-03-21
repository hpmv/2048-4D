function Grid(size) {
  this.size = size.copy();
  this.totalCells = 1;
  for (var i = 0; i < size.length; i++) {
    this.totalCells *= this.size[i];
  }

  this.cells = [];

  this.build();
}

Grid.prototype.positionToInt = function (pos) {
  var result = 0;
  for (var i = this.size.length - 1; i >= 0; i--) {
    result *= this.size[i];
    result += pos[i];
  }
  return result;
};

Grid.prototype.intToPosition = function (int) {
  var result = Vector(this.size.length);
  for (var i = 0; i < this.size.length; i++) {
    result[i] = int % this.size[i];
    int -= result[i];
    int /= this.size[i];
  }
  return result;
};

// Build a grid of the specified size
Grid.prototype.build = function () {
  for (var i = 0; i < this.totalCells; i++) {
    this.cells[i] = null;
  }
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
  return null;
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (position, tile) {
    if (!tile) {
      cells.push(position.copy());
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var i = 0; i < this.totalCells; i++) {
    var result = callback(this.intToPosition(i), this.cells[i]);
    if (result) return;
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[this.positionToInt(cell)];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[this.positionToInt(tile.position)] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[this.positionToInt(tile.position)] = null;
};

Grid.prototype.withinBounds = function (position) {
  for (var i = 0; i < this.size.length; i++) {
    if (position[i] < 0 || position[i] >= this.size[i]) {
      return false;
    }
  }
  return true;
};
