const UI = {
  els: {},

  init() {
    this.els = {
      balance: document.getElementById('balance'),
      statWins: document.getElementById('stat-wins'),
      statLosses: document.getElementById('stat-losses'),
      statPushes: document.getElementById('stat-pushes'),
      statStreak: document.getElementById('stat-streak'),
      statDeck: document.getElementById('stat-deck'),
      dealerCards: document.getElementById('dealer-cards'),
      dealerScore: document.getElementById('dealer-score'),
      playerHands: document.getElementById('player-hands'),
      messageOverlay: document.getElementById('message-overlay'),
      bettingPanel: document.getElementById('betting-panel'),
      actionPanel: document.getElementById('action-panel'),
      currentBet: document.getElementById('current-bet'),
      btnDeal: document.getElementById('btn-deal'),
      btnClearBet: document.getElementById('btn-clear-bet'),
      btnHit: document.getElementById('btn-hit'),
      btnStand: document.getElementById('btn-stand'),
      btnDouble: document.getElementById('btn-double'),
      btnSplit: document.getElementById('btn-split'),
      btnNewRound: document.getElementById('btn-new-round'),
      btnReset: document.getElementById('btn-reset'),
      chipButtons: document.querySelectorAll('.chip-btn'),
    };
  },

  formatNumber(n) {
    return n.toLocaleString('ko-KR');
  },

  createCardElement(card, faceDown) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    if (faceDown) {
      wrapper.appendChild(CardArt.createBack());
      return wrapper;
    }

    wrapper.appendChild(CardArt.createFace(card));
    return wrapper;
  },

  renderCards(container, cards, hideSecond) {
    container.innerHTML = '';
    cards.forEach((card, i) => {
      const faceDown = hideSecond && i === 1;
      container.appendChild(this.createCardElement(card, faceDown));
    });
  },

  resultLabel(result) {
    switch (result) {
      case 'win': return '승리!';
      case 'lose': return '패배';
      case 'push': return '무승부';
      case 'blackjack': return '블랙잭!';
      default: return '';
    }
  },

  render() {
    const g = Game;

    this.els.balance.textContent = this.formatNumber(g.balance);
    this.els.statWins.textContent = `승 ${g.stats.wins}`;
    this.els.statLosses.textContent = `패 ${g.stats.losses}`;
    this.els.statPushes.textContent = `무 ${g.stats.pushes}`;
    this.els.statStreak.textContent = `연승 ${g.stats.currentStreak}`;
    this.els.statDeck.textContent =
      `카드 ${this.formatNumber(g.remainingCards())} / ${this.formatNumber(g.initialShoeSize)}`;

    this.els.currentBet.textContent = this.formatNumber(g.pendingBet);

    const hideDealerHole =
      g.dealerHoleHidden && g.state !== GameState.ROUND_END;

    this.renderCards(this.els.dealerCards, g.dealerHand, hideDealerHole);

    if (g.dealerHand.length > 0) {
      this.els.dealerScore.textContent = Hand.formatScore(
        g.dealerHand,
        hideDealerHole
      );
    } else {
      this.els.dealerScore.textContent = '';
    }

    this.els.playerHands.innerHTML = '';

    g.playerHands.forEach((hand, index) => {
      const section = document.createElement('section');
      section.className = 'player-hand';
      if (
        g.state === GameState.PLAYER_TURN &&
        index === g.activeHandIndex &&
        !hand.stood &&
        !hand.busted
      ) {
        section.classList.add('active');
      }

      const label = document.createElement('div');
      label.className = 'hand-label';

      const leftGroup = document.createElement('div');
      leftGroup.className = 'hand-info-left';

      const nameSpan = document.createElement('span');
      nameSpan.textContent =
        g.playerHands.length > 1 ? `핸드 ${index + 1}` : '플레이어';

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'score';
      scoreSpan.textContent = Hand.formatScore(hand.cards, false);

      leftGroup.appendChild(nameSpan);
      leftGroup.appendChild(scoreSpan);

      const betSpan = document.createElement('span');
      betSpan.className = 'hand-bet';
      betSpan.textContent = `베팅: ${this.formatNumber(hand.bet)}`;

      label.appendChild(leftGroup);
      label.appendChild(betSpan);

      const cardsDiv = document.createElement('div');
      cardsDiv.className = 'cards';
      hand.cards.forEach((card) => {
        cardsDiv.appendChild(this.createCardElement(card, false));
      });

      section.appendChild(label);
      section.appendChild(cardsDiv);

      if (hand.result && g.state === GameState.ROUND_END) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `hand-result ${hand.result}`;
        resultDiv.textContent = this.resultLabel(hand.result);
        section.appendChild(resultDiv);
      }

      this.els.playerHands.appendChild(section);
    });

    this.updatePanels();
    this.updateButtons();
    this.updateMessage();
  },

  updatePanels() {
    const g = Game;
    const isBetting = g.state === GameState.BETTING;
    const isRoundEnd = g.state === GameState.ROUND_END;

    this.els.bettingPanel.classList.toggle('hidden', !isBetting);
    this.els.actionPanel.classList.toggle(
      'hidden',
      isBetting || isRoundEnd
    );
    this.els.btnNewRound.classList.toggle('hidden', !isRoundEnd);
  },

  updateButtons() {
    const g = Game;
    const isBetting = g.state === GameState.BETTING;

    this.els.btnDeal.disabled = !g.canDeal();
    this.els.btnClearBet.disabled = !isBetting || g.pendingBet === 0;

    this.els.chipButtons.forEach((btn) => {
      const amount = parseInt(btn.dataset.bet, 10);
      btn.disabled =
        !isBetting || g.pendingBet + amount > g.balance;
    });

    this.els.btnHit.disabled = !g.canHit();
    this.els.btnStand.disabled = !g.canStand();
    this.els.btnDouble.disabled = !g.canDouble();
    this.els.btnSplit.disabled = !g.canSplit();
  },

  updateMessage() {
    const g = Game;
    const overlay = this.els.messageOverlay;

    if (g.shoeJustReshuffled && g.state === GameState.BETTING) {
      overlay.textContent = '4벌 소진! 새 카드를 섞었습니다';
      overlay.classList.remove('hidden');
      return;
    }

    if (g.state !== GameState.ROUND_END) {
      overlay.classList.add('hidden');
      overlay.textContent = '';
      return;
    }

    if (g.isGameOver()) {
      overlay.textContent = '잔액 소진! 리셋하세요';
      overlay.classList.remove('hidden');
      return;
    }

    const results = g.playerHands.map((h) => h.result);
    const hasBJ = results.includes('blackjack');
    const wins = results.filter((r) => r === 'win' || r === 'blackjack').length;
    const losses = results.filter((r) => r === 'lose').length;

    let msg = '';
    if (hasBJ) msg = 'Blackjack!';
    else if (wins > 0 && losses === 0) msg = 'You Win!';
    else if (losses > 0 && wins === 0) msg = 'Dealer Wins';
    else if (results.every((r) => r === 'push')) msg = 'Push';
    else msg = 'Round Over';

    overlay.textContent = msg;
    overlay.classList.remove('hidden');
  },
};
