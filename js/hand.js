const Hand = {
  rankValue(rank) {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank, 10);
  },

  calculateScore(cards) {
    let score = 0;
    let aces = 0;

    for (const card of cards) {
      score += this.rankValue(card.rank);
      if (card.rank === 'A') aces++;
    }

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  },

  isBlackjack(cards) {
    return cards.length === 2 && this.calculateScore(cards) === 21;
  },

  isBust(cards) {
    return this.calculateScore(cards) > 21;
  },

  canSplit(hand) {
    return (
      hand.cards.length === 2 &&
      !hand.doubled &&
      !hand.splitFrom
    );
  },

  canDoubleDown(hand, balance) {
    return (
      hand.cards.length === 2 &&
      !hand.doubled &&
      balance >= hand.bet
    );
  },

  formatScore(cards, hideSecond) {
    if (hideSecond && cards.length >= 2) {
      return String(this.calculateScore([cards[0]]));
    }
    return String(this.calculateScore(cards));
  },
};
