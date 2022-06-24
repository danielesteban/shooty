import { Group, Vector3 } from 'three';
import Foe from '../renderables/foe.js';

const _direction = new Vector3();
const _wiggle = new Vector3();

class Foes extends Group {
  constructor({ count, projectiles }) {
    super();
    this.matrixAutoUpdate = false;
    this.projectiles = projectiles;
    for (let i = 0; i < count; i++) {
      const foe = new Foe();
      projectiles.targets.push(foe);
      this.add(foe);
    }
  }

  onAnimationTick(anchor, target, isPaused, delta, time) {
    const { children, projectiles } = this;
    children.forEach((foe) => {
      if (!foe.visible) {
        foe.randomize();
        foe.firingTimer = 0.5 + Math.random() * 2;
        foe.minZ = -10 - Math.random() * 5;
        foe.speed = 10 * (1.5 + Math.random());
        foe.offset.set((Math.random() - 0.5), Math.random() * 0.75, 0).multiplyScalar(16);
        foe.offset.z = -128 - Math.floor(Math.random() * 16) * 8;
        foe.visible = true;
        foe.wiggle.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(16);
      }
      if (!isPaused) {
        foe.firingTimer -= delta;
        if (foe.firingTimer <= 0) {
          foe.firingTimer = 0.5 + Math.random() * 2;
          _direction.subVectors(target, foe.position);
          if (_direction.length() <= 40) {
            _direction.x += (Math.random() - 0.5) * 2;
            _direction.y += (Math.random() - 0.5) * 2;
            _direction.z += (Math.random() - 0.5) * 2;
            projectiles.shoot({
              color: foe.color,
              direction: _direction.normalize(),
              offset: foe.scale.x,
              origin: foe.position,
              owner: foe,
            });
          }
        }
      }
      foe.offset.z = Math.min(foe.offset.z + foe.speed * delta, foe.minZ);
      foe.position.addVectors(anchor, foe.offset);
      _wiggle.copy(foe.wiggle).addScalar(time).multiplyScalar(foe.speed * 0.1);
      foe.position.x += Math.sin(_wiggle.x) * 1;
      foe.position.y += Math.sin(_wiggle.y) * 1;
      foe.position.z += Math.sin(_wiggle.z) * 1;
      _direction.copy(target);
      _direction.x += Math.sin(_wiggle.x) * 0.5;
      _direction.y += Math.sin(_wiggle.y * 0.5) * 0.5;
      foe.lookAt(_direction);
      foe.time = _wiggle.z * 2.0;
    });
  }

  reset() {
    const { children } = this;
    children.forEach((foe) => {
      foe.visible = false;
    });
  }
}

export default Foes;
