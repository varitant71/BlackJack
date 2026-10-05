const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SHOE_DECK_COUNT = 4;
const CARDS_PER_DECK = 52;
const MIN_CARDS_TO_DEAL = 4;

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const Deck = {
  SHOE_DECK_COUNT,
  CARDS_PER_DECK,

  create() {
    const cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank });
      }
    }
    return cards;
  },

  createShoe(deckCount = SHOE_DECK_COUNT) {
    const cards = [];
    for (let i = 0; i < deckCount; i++) {
      cards.push(...this.create());
    }
    return cards;
  },

  shoeSize(deckCount = SHOE_DECK_COUNT) {
    return deckCount * CARDS_PER_DECK;
  },

  shuffle(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  draw(deck) {
    if (deck.length === 0) {
      return { card: null, deck };
    }
    const card = deck.pop();
    return { card, deck };
  },

  newShuffledDeck() {
    return this.shuffle(this.create());
  },

  newShoe(deckCount = SHOE_DECK_COUNT) {
    return this.shuffle(this.createShoe(deckCount));
  },
};
