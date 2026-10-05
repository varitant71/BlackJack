const AudioManager = {
  ctx: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.ctx = null;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  beep(frequency, duration, type = 'sine', volume = 0.15) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  play(name) {
    this.resume();

    switch (name) {
      case 'chip':
        this.beep(800, 0.08, 'square', 0.1);
        break;
      case 'deal':
        this.beep(400, 0.06, 'triangle', 0.12);
        setTimeout(() => this.beep(500, 0.06, 'triangle', 0.1), 60);
        break;
      case 'win':
        this.beep(523, 0.12, 'sine', 0.15);
        setTimeout(() => this.beep(659, 0.12, 'sine', 0.15), 120);
        setTimeout(() => this.beep(784, 0.2, 'sine', 0.15), 240);
        break;
      case 'lose':
        this.beep(300, 0.15, 'sawtooth', 0.12);
        setTimeout(() => this.beep(200, 0.25, 'sawtooth', 0.1), 150);
        break;
      case 'blackjack':
        this.beep(880, 0.1, 'sine', 0.15);
        setTimeout(() => this.beep(1100, 0.15, 'sine', 0.15), 100);
        setTimeout(() => this.beep(1320, 0.25, 'sine', 0.15), 220);
        break;
      case 'push':
        this.beep(440, 0.15, 'triangle', 0.1);
        break;
      default:
        break;
    }
  },
};
