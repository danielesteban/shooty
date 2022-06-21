class Hud {
  constructor() {
    const hud = document.getElementById('hud');
    {
      const health = document.createElement('div');
      this.health = {
        dom: health,
        value: -1,
      };
      hud.appendChild(health);
    }
    {
      const timer = document.createElement('div');
      this.timer = {
        dom: timer,
        value: -1,
      };
      hud.appendChild(timer);
    }
    {
      const score = document.createElement('div');
      this.score = {
        dom: score,
        value: -1,
      };
      hud.appendChild(score);
    }
    this.reset();
  }

  reset() {
    this.updateHealth(Hud.maxHealth);
    this.updateTimer(0);
    this.updateScore(0);
  }

  updateHealth(value) {
    const { health } = this;
    if (health.value === value) {
      return;
    }
    health.value = value;
    health.dom.innerText = Array.from({ length: 8 }, (v, i) => i < value ? '♥' : '♡').join('');
  }

  updateScore(value) {
    const { score } = this;
    if (score.value === value) {
      return;
    }
    score.value = value;
    score.dom.innerText = `0000000000${value}`.slice(-10);
  }

  updateTimer(value) {
    const { timer } = this;
    value = Math.floor(value);
    if (timer.value === value) {
      return;
    }
    timer.value = value;
    const m = Math.floor(value / 60);
    const s = Math.floor(value % 60);
    timer.dom.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

Hud.maxHealth = 8;

export default Hud;
