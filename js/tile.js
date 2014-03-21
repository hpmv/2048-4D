function Tile(position, value) {
  this.position = position.copy();
  this.value            = value || 2;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = this.position.copy();
};

Tile.prototype.updatePosition = function (position) {
  this.position = position.copy();
};
