document.addEventListener('DOMContentLoaded', () => {
  AudioManager.init();
  UI.init();

  Game.loadSave();
  Game.initShoe();
  UI.render();

  UI.els.chipButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      AudioManager.resume();
      Game.shoeJustReshuffled = false;
      const amount = parseInt(btn.dataset.bet, 10);
      if (Game.addBet(amount)) UI.render();
    });
  });

  UI.els.btnClearBet.addEventListener('click', () => {
    Game.clearBet();
    UI.render();
  });

  UI.els.btnDeal.addEventListener('click', () => {
    AudioManager.resume();
    Game.shoeJustReshuffled = false;
    if (Game.deal()) UI.render();
  });

  UI.els.btnHit.addEventListener('click', () => {
    if (Game.hit()) UI.render();
  });

  UI.els.btnStand.addEventListener('click', () => {
    if (Game.stand()) UI.render();
  });

  UI.els.btnDouble.addEventListener('click', () => {
    if (Game.doubleDown()) UI.render();
  });

  UI.els.btnSplit.addEventListener('click', () => {
    if (Game.split()) UI.render();
  });

  UI.els.btnNewRound.addEventListener('click', () => {
    Game.resetRound();
    UI.render();
  });

  UI.els.btnReset.addEventListener('click', () => {
    if (confirm('잔액과 통계를 초기화할까요?')) {
      Game.resetGame();
      UI.render();
    }
  });

  document.body.addEventListener('click', () => AudioManager.resume(), { once: true });
});
