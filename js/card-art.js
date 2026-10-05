const CardArt = {
  suitNames: {
    hearts: 'heart',
    diamonds: 'diamond',
    clubs: 'club',
    spades: 'spade',
  },

  rankNames: {
    A: '1',
    J: 'jack',
    Q: 'queen',
    K: 'king',
  },

  imagePath(card) {
    const suit = this.suitNames[card.suit];
    const rank = this.rankNames[card.rank] || card.rank;
    return `assets/cards/${suit}_${rank}.png`;
  },

  backPath() {
    return 'assets/cards/back.png';
  },

  createFace(card) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = this.imagePath(card);
    img.alt = `${card.rank} of ${card.suit}`;
    img.draggable = false;
    return img;
  },

  createBack() {
    const img = document.createElement('img');
    img.className = 'card-img card-back-img';
    img.src = this.backPath();
    img.alt = 'Card back';
    img.draggable = false;
    return img;
  },
};
