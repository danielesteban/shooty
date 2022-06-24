import { Group } from 'three';
import Powerup from '../renderables/powerup.js';

class Powerups extends Group {
  constructor({ count, projectiles }) {
    super();
    this.matrixAutoUpdate = false;
    for (let i = 0; i < count; i++) {
      const powerup = new Powerup();
      projectiles.targets.push(powerup);
      this.add(powerup);
    }
  }

  onAnimationTick(anchor, time) {
    const { children } = this;
    children.forEach((powerup, i) => {
      if (!powerup.visible || powerup.position.z > anchor.z) {
        powerup.position.set((Math.random() - 0.5), Math.random() * 0.75, 0).multiplyScalar(8).add(anchor);
        powerup.position.z -= 128 + Math.floor(Math.random() * 32) * 8;
        powerup.baseY = powerup.position.y;
        powerup.visible = true;
      }
      powerup.position.y = powerup.baseY + Math.sin((time + i) * 2) * 0.05;
      powerup.rotation.y = (time + i);
    });
  }

  reset() {
    const { children } = this;
    children.forEach((powerup) => {
      powerup.visible = false;
    });
  }
}

export default Powerups;
