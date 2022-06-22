import { Group } from 'three';
import Powerup from '../renderables/powerup.js';

class Powerups extends Group {
  constructor({ count, projectiles }) {
    super();
    this.matrixAutoUpdate = false;
    this.projectiles = projectiles;
    for (let i = 0; i < count; i++) {
      this.spawn();
    }
  }

  onAnimationTick(anchor, delta, time) {
    const { children } = this;
    children.forEach((powerup, i) => {
      if (!powerup.visible || powerup.position.z > anchor.z) {
        powerup.position.set((Math.random() - 0.5), Math.random(), 0).multiplyScalar(2).add(anchor);
        powerup.position.y += 0.5;
        powerup.position.z -= 16 + Math.floor(Math.random() * 16) * 4;
        powerup.baseY = powerup.position.y;
        powerup.visible = true;
      }
      powerup.position.y = powerup.baseY + Math.sin((time + i) * 2) * 0.05;
      powerup.rotation.y += delta;
      powerup.rotation.z += delta;
    });
  }

  spawn() {
    const { projectiles } = this;
    const powerup = new Powerup();
    projectiles.targets.push(powerup);
    this.add(powerup);
  }
}

export default Powerups;
