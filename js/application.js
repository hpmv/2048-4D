// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  new GameManager(Vector(4, [2, 2, 2, 2]), 1, KeyboardInputManager, HTMLActuator, LocalScoreManager);
});
