function HTMLActuator(size, grid) {
  this.size = size.copy();
  this.grid = grid;
  this.gridContainer = document.querySelector(".grid-container");
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message-wrapper");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
  this.layoutParams = {
    maxWidth: 1000,
    maxHeight: 700,
    tileSize: 100,
    baseMargin: 15,
    incrementMargin: 10
  };
  this.layout = this.calculateGridPositions(this.layoutParams);
}

HTMLActuator.prototype.actuate = function (metadata) {
  window.requestAnimationFrame(function () {
    this.clearContainer(this.gridContainer);
    this.clearContainer(this.tileContainer);
    $(this.gridContainer).css({
      width: this.layout.gridWidth + 'px',
      height: this.layout.gridHeight + 'px'
    });
    $('.game-container').css({
      width: this.layout.gridWidth + 30 + 'px',
      height: this.layout.gridHeight + 30 + 'px'
    });
    $('.game-message-wrapper').css({
      width: this.layout.gridWidth + 30 + 'px',
      height: this.layout.gridHeight + 30 + 'px'
    });

    this.grid.eachCell(function (cell, tile) {
      if (tile) {
        this.addTile(tile);
      }
    }.bind(this));

    var gridRows = [];
    var nrow = 1;
    var ncol = 1;
    for (var dim = 0; dim < this.size.length; dim++) {
      if (dim % 2 == 0) {
        ncol *= this.size[dim];
      } else {
        nrow *= this.size[dim];
      }
    }

    for (var i = 0; i < this.grid.totalCells; i++) {
      var position = this.grid.intToPosition(i);
      var row = 0;
      var col = 0;
      var dimX = 0;
      var dimY = 0;
      for (var dim = position.length - 1; dim >= 0; dim--) {
        if (dim % 2 == 0) {
          col *= this.size[dim];
          col += position[dim];
        } else {
          row *= this.size[dim];
          row += position[dim];
        }
      }
      for (var dim = 0; dim < position.length; dim++) {
        if (dim % 2 == 0) {
          if (position[dim] == this.size[dim] - 1 && dim / 2 == dimX) dimX++;
        } else {
          if (position[dim] == this.size[dim] - 1 && (dim - 1) / 2 == dimY) dimY++;
        }
      }
      if (col == 0) {
        var gridRow = $("<div>").addClass('grid-row').css({
          'margin-bottom': (row == nrow - 1 ? 0 : (this.layout.baseMargin + dimY * this.layout.incrementMargin)) + 'px'
        });
        gridRows.push(gridRow);
        $(this.gridContainer).append(gridRow);
      }
      gridRows[row].append(
          $("<div>").addClass('grid-cell').css({
            width: this.layout.tileSize,
            height: this.layout.tileSize,
            'margin-right': (col == ncol - 1 ? 0 : (this.layout.baseMargin + dimX * this.layout.incrementMargin)) + 'px'
          })
      );
    }

    this.updateScore(metadata.score);
    this.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        this.message(false); // You lose
      } else if (metadata.won) {
        this.message(true); // You win!
      }
    }

  }.bind(this));
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.applyTransform = function (tile, position) {
  var coordinates = this.tileCoordinates(position);
  var str = 'translate(' + coordinates[0] + 'px,' + coordinates[1] + 'px)';
  $(tile).css({
    width: this.layout.tileSize,
    height: this.layout.tileSize,
    'font-size': 55 * this.layout.scaling + 'px',
    'transform': str,
    '-moz-transform': str,
    '-webkit-transform': str
  });
//  $(tile).find('.tile-inner').css({
//    'padding-top': 10 * this.layout.scaling + 'px'
//  })
}

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position = tile.previousPosition || tile.position.copy();

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);
  this.applyTransform(wrapper, position);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;


  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      //classes[2] = self.positionClass(tile.position.copy());
      //self.applyClasses(wrapper, classes); // Update the position
      self.applyTransform(wrapper, tile.position.copy());
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.tileCoordinates = function (position) {
  return this.layout.positions[this.grid.positionToInt(position)];
};

HTMLActuator.prototype.calculateGridPositions = function (layoutParams) {
  var tileSize = layoutParams.tileSize;
  var baseMargin = layoutParams.baseMargin;
  var incrementMargin = layoutParams.incrementMargin;
  var horizontal = tileSize;
  var vertical = tileSize;
  var horizontalSizes = [];
  var verticalSizes = [];
  for (var i = 0; i < this.size.length; i++) {
    if (i % 2 == 0) {
      horizontalSizes.push(horizontal);
      horizontal *= this.size[i];
      horizontal += (this.size[i] - 1) * (baseMargin + i / 2 * incrementMargin);
    } else {
      verticalSizes.push(vertical);
      vertical *= this.size[i];
      vertical += (this.size[i] - 1) * (baseMargin + (i - 1) / 2 * incrementMargin);
    }
  }
  var scaling = 1;
  if (scaling * horizontal > layoutParams.maxWidth) {
    scaling = layoutParams.maxWidth / horizontal;
  }
  if (scaling * vertical > layoutParams.maxHeight) {
    scaling = layoutParams.maxHeight / vertical;
  }
  var positions = [];
  for (var i = 0; i < this.grid.totalCells; i++) {
    var position = this.grid.intToPosition(i);
    var x = 0;
    var y = 0;
    for (var dim = 0; dim < position.length; dim++) {
      if (dim % 2 == 0) {
        x += (horizontalSizes[dim / 2] + baseMargin + dim / 2 * incrementMargin) * position[dim];
      } else {
        y += (verticalSizes[(dim - 1) / 2] + baseMargin + (dim - 1) / 2 * incrementMargin) * position[dim];
      }
    }
    x *= scaling;
    y *= scaling;
    positions.push([x, y]);
  }
  return {
    scaling: scaling,
    gridWidth: horizontal * scaling,
    gridHeight: vertical * scaling,
    tileSize: tileSize * scaling,
    positions: positions,
    baseMargin: baseMargin * scaling,
    incrementMargin: incrementMargin * scaling
  };
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  //this.clearContainer(this.sharingContainer);
  //this.sharingContainer.appendChild(this.scoreTweetButton());
  //twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "http://git.io/2048");
  tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048, a game where you " +
             "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
