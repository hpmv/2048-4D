var gameSize = [2,2,2,2];
function chooseSize(size, button) {
  gameSize = size;
  $('.button-selected').removeClass('button-selected');
  $(button).addClass("button-selected");
}

function startGame() {
  if (!gameSize) {
    gameSize = JSON.parse($('#custom-dimension-input').val());
  }
  var totalCells = 1;
  for(var i=0;i<gameSize.length;i++) {
    totalCells *= gameSize[i];
  }
  window.requestAnimationFrame(function () {
    new GameManager(Vector(gameSize.length, gameSize), Math.max(Math.min(gameSize.length - 1, totalCells/16), 1), KeyboardInputManager, HTMLActuator, LocalScoreManager);
  });
}