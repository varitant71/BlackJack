const GameState = {
  BETTING: 'BETTING',
  PLAYER_TURN: 'PLAYER_TURN',
  DEALER_TURN: 'DEALER_TURN',
  ROUND_END: 'ROUND_END',
};

const STORAGE_KEY = 'blackjack_save';

const Game = {
  balance: 1000,
  pendingBet: 0,
  deck: [],
  initialShoeSize: Deck.shoeSize(),
  shoeJustReshuffled: false,
  dealerHand: [],
  playerHands: [],
  activeHandIndex: 0,
  state: GameState.BETTING,
  dealerHoleHidden: false,
  roundResults: [],
  stats: {
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0,
    currentStreak: 0,
    bestStreak: 0,
  },

  loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.balance === 'number') this.balance = data.balance;
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
    } catch {
      /* ignore corrupt save */
    }
  },

  save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ balance: this.balance, stats: this.stats })
    );
  },

  resetGame() {
    this.balance = 1000;
    this.pendingBet = 0;
    this.stats = {
      wins: 0,
      losses: 0,
      pushes: 0,
      blackjacks: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
    this.initShoe();
    this.resetRound();
    this.save();
  },

  initShoe() {
    this.deck = Deck.newShoe();
    this.initialShoeSize = Deck.shoeSize();
    this.shoeJustReshuffled = false;
  },

  reshuffleShoe() {
    this.deck = Deck.newShoe();
    this.initialShoeSize = Deck.shoeSize();
    this.shoeJustReshuffled = true;
  },

  remainingCards() {
    return this.deck.length;
  },

  isShoeDepleted() {
    return this.deck.length < MIN_CARDS_TO_DEAL;
  },

  ensureShoeForDeal() {
    if (this.isShoeDepleted()) {
      this.reshuffleShoe();
      return true;
    }
    return false;
  },

  drawCard() {
    const { card, deck } = Deck.draw(this.deck);
    this.deck = deck;
    return card;
  },

  resetRound() {
    if (this.isShoeDepleted()) {
      this.reshuffleShoe();
    }
    this.dealerHand = [];
    this.playerHands = [];
    this.activeHandIndex = 0;
    this.state = GameState.BETTING;
    this.dealerHoleHidden = false;
    this.roundResults = [];
    this.pendingBet = 0;
  },

  addBet(amount) {
    if (this.state !== GameState.BETTING) return false;
    if (this.pendingBet + amount > this.balance) return false;
    this.pendingBet += amount;
    AudioManager.play('chip');
    return true;
  },

  clearBet() {
    if (this.state !== GameState.BETTING) return;
    this.pendingBet = 0;
  },

  canDeal() {
    return this.state === GameState.BETTING && this.pendingBet > 0;
  },

  deal() {
    if (!this.canDeal()) return false;

    this.ensureShoeForDeal();

    this.balance -= this.pendingBet;
    const bet = this.pendingBet;
    this.pendingBet = 0;
    this.state = GameState.PLAYER_TURN;

    const playerCards = [this.drawCard(), this.drawCard()];
    const dealerCards = [this.drawCard(), this.drawCard()];

    this.playerHands = [{
      cards: playerCards,
      bet,
      doubled: false,
      stood: false,
      busted: false,
      splitFrom: null,
      result: null,
    }];

    this.dealerHand = dealerCards;
    this.dealerHoleHidden = true;
    this.activeHandIndex = 0;

    AudioManager.play('deal');

    const playerBJ = Hand.isBlackjack(playerCards);
    const dealerBJ = Hand.isBlackjack(dealerCards);

    if (playerBJ || dealerBJ) {
      this.dealerHoleHidden = false;
      this.resolveBlackjackOpening(playerBJ, dealerBJ);
      return true;
    }

    return true;
  },

  resolveBlackjackOpening(playerBJ, dealerBJ) {
    const hand = this.playerHands[0];

    if (playerBJ && dealerBJ) {
      hand.result = 'push';
      this.balance += hand.bet;
      this.recordStat('push');
      AudioManager.play('push');
    } else if (playerBJ) {
      const payout = hand.bet + Math.floor(hand.bet * 1.5);
      hand.result = 'blackjack';
      this.balance += payout;
      this.recordStat('blackjack');
      AudioManager.play('blackjack');
    } else {
      hand.result = 'lose';
      this.recordStat('loss');
      AudioManager.play('lose');
    }

    hand.stood = true;
    this.state = GameState.ROUND_END;
    this.save();
  },

  getActiveHand() {
    return this.playerHands[this.activeHandIndex];
  },

  hit() {
    if (this.state !== GameState.PLAYER_TURN) return false;
    const hand = this.getActiveHand();
    if (!hand || hand.stood || hand.busted || hand.doubled) return false;

    const card = this.drawCard();
    hand.cards.push(card);
    AudioManager.play('deal');

    if (Hand.isBust(hand.cards)) {
      hand.busted = true;
      hand.stood = true;
      hand.result = 'lose';
      this.advanceHand();
    }

    return true;
  },

  stand() {
    if (this.state !== GameState.PLAYER_TURN) return false;
    const hand = this.getActiveHand();
    if (!hand || hand.stood || hand.busted) return false;

    hand.stood = true;
    this.advanceHand();
    return true;
  },

  doubleDown() {
    if (this.state !== GameState.PLAYER_TURN) return false;
    const hand = this.getActiveHand();
    if (!hand || !Hand.canDoubleDown(hand, this.balance)) return false;

    this.balance -= hand.bet;
    hand.bet *= 2;
    hand.doubled = true;

    const card = this.drawCard();
    hand.cards.push(card);
    AudioManager.play('chip');
    AudioManager.play('deal');

    if (Hand.isBust(hand.cards)) {
      hand.busted = true;
      hand.result = 'lose';
    }

    hand.stood = true;
    this.advanceHand();
    return true;
  },

  split() {
    if (this.state !== GameState.PLAYER_TURN) return false;
    const hand = this.getActiveHand();
    if (!hand || !Hand.canSplit(hand) || this.balance < hand.bet) return false;

    this.balance -= hand.bet;
    const card1 = hand.cards[0];
    const card2 = hand.cards[1];

    const draw = () => this.drawCard();

    this.playerHands[this.activeHandIndex] = {
      cards: [card1, draw()],
      bet: hand.bet,
      doubled: false,
      stood: false,
      busted: false,
      splitFrom: true,
      result: null,
    };

    this.playerHands.splice(this.activeHandIndex + 1, 0, {
      cards: [card2, draw()],
      bet: hand.bet,
      doubled: false,
      stood: false,
      busted: false,
      splitFrom: true,
      result: null,
    });

    AudioManager.play('chip');
    AudioManager.play('deal');
    return true;
  },

  advanceHand() {
    const nextIndex = this.playerHands.findIndex(
      (h, i) => i > this.activeHandIndex && !h.stood && !h.busted
    );

    if (nextIndex !== -1) {
      this.activeHandIndex = nextIndex;
      return;
    }

    const allResolved = this.playerHands.every(
      (h) => h.busted || (h.stood && h.result)
    );

    const anyAlive = this.playerHands.some((h) => !h.busted);

    if (allResolved || !anyAlive) {
      this.playerHands.forEach((h) => {
        if (!h.result) h.result = 'lose';
      });
      this.dealerHoleHidden = false;
      this.recordRoundStats();
      this.state = GameState.ROUND_END;
      this.save();
      return;
    }

    this.state = GameState.DEALER_TURN;
    this.dealerHoleHidden = false;
    this.playDealerTurn();
  },

  playDealerTurn() {
    while (Hand.calculateScore(this.dealerHand) < 17) {
      const card = this.drawCard();
      this.dealerHand.push(card);
      AudioManager.play('deal');
    }

    this.resolveAllHands();
    this.state = GameState.ROUND_END;
    this.save();
  },

  resolveAllHands() {
    const dealerScore = Hand.calculateScore(this.dealerHand);
    const dealerBust = Hand.isBust(this.dealerHand);
    const dealerBJ = Hand.isBlackjack(this.dealerHand);

    for (const hand of this.playerHands) {
      if (hand.result) continue;

      const playerScore = Hand.calculateScore(hand.cards);
      const playerBJ = Hand.isBlackjack(hand.cards) && !hand.splitFrom;

      if (playerBJ && !dealerBJ) {
        const payout = hand.bet + Math.floor(hand.bet * 1.5);
        hand.result = 'blackjack';
        this.balance += payout;
      } else if (dealerBust) {
        hand.result = 'win';
        this.balance += hand.bet * 2;
      } else if (playerScore > dealerScore) {
        hand.result = 'win';
        this.balance += hand.bet * 2;
      } else if (playerScore < dealerScore) {
        hand.result = 'lose';
      } else {
        hand.result = 'push';
        this.balance += hand.bet;
      }
    }

    this.recordRoundStats();
  },

  recordRoundStats() {
    let roundWin = false;
    let roundLoss = false;
    let roundPush = false;
    let hasBlackjack = false;

    for (const hand of this.playerHands) {
      if (hand.result === 'win') roundWin = true;
      if (hand.result === 'lose') roundLoss = true;
      if (hand.result === 'push') roundPush = true;
      if (hand.result === 'blackjack') hasBlackjack = true;
    }

    if (hasBlackjack) {
      this.stats.blackjacks++;
      AudioManager.play('blackjack');
    } else if (roundWin && !roundLoss) {
      this.stats.wins++;
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
      AudioManager.play('win');
    } else if (roundLoss && !roundWin) {
      this.stats.losses++;
      this.stats.currentStreak = 0;
      AudioManager.play('lose');
    } else if (roundPush && !roundWin && !roundLoss) {
      this.stats.pushes++;
      AudioManager.play('push');
    } else if (roundWin && roundLoss) {
      this.stats.currentStreak = 0;
    }
  },

  recordStat(type) {
    if (type === 'blackjack') {
      this.stats.blackjacks++;
      this.stats.wins++;
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
    } else if (type === 'push') {
      this.stats.pushes++;
      this.stats.currentStreak = 0;
    } else if (type === 'loss') {
      this.stats.losses++;
      this.stats.currentStreak = 0;
    }
  },

  canHit() {
    const hand = this.getActiveHand();
    return (
      this.state === GameState.PLAYER_TURN &&
      hand &&
      !hand.stood &&
      !hand.busted &&
      !hand.doubled
    );
  },

  canStand() {
    const hand = this.getActiveHand();
    return (
      this.state === GameState.PLAYER_TURN &&
      hand &&
      !hand.stood &&
      !hand.busted
    );
  },

  canDouble() {
    const hand = this.getActiveHand();
    return (
      this.state === GameState.PLAYER_TURN &&
      hand &&
      Hand.canDoubleDown(hand, this.balance)
    );
  },

  canSplit() {
    const hand = this.getActiveHand();
    return (
      this.state === GameState.PLAYER_TURN &&
      hand &&
      Hand.canSplit(hand) &&
      this.balance >= hand.bet &&
      this.playerHands.length < 2
    );
  },

  isGameOver() {
    return this.balance <= 0 && this.state === GameState.ROUND_END;
  },
};
