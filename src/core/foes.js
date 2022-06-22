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
      this.spawn();
    }
  }

  onAnimationTick(anchor, target, isPaused, delta, time) {
    const { children, projectiles } = this;
    children.forEach((foe) => {
      if (!isPaused) {
        foe.firingTimer -= delta;
        if (foe.firingTimer <= 0) {
          foe.firingTimer = Math.random() * 2;
          _direction.subVectors(target, foe.position);
          if (_direction.length() <= 6) {
            _direction.x += (Math.random() - 0.5) * 0.5;
            _direction.y += (Math.random() - 0.5) * 0.5;
            _direction.z += (Math.random() - 0.5) * 0.5;
            projectiles.shoot({
              color: foe.color,
              direction: _direction.normalize(),
              origin: foe.position,
              owner: foe,
            });
          }
        }
      }
      foe.offset.z = Math.min(foe.offset.z + foe.speed * delta, foe.minZ);
      foe.position.addVectors(anchor, foe.offset);
      _wiggle.copy(foe.wiggle).addScalar(time).multiplyScalar(foe.speed * 0.5);
      foe.position.x += Math.sin(_wiggle.x) * 0.1;
      foe.position.y += Math.sin(_wiggle.y) * 0.1;
      foe.position.z += Math.sin(_wiggle.z) * 0.1;
      _direction.copy(target);
      _direction.x += Math.sin(_wiggle.x) * 0.5;
      _direction.y += Math.sin(_wiggle.y * 0.5) * 0.5;
      foe.lookAt(_direction);
      foe.time = _wiggle.z * 2;
    });
  }

  spawn() {
    const { projectiles } = this;
    const foe = new Foe();
    this.respawn(foe);
    projectiles.targets.push(foe);
    this.add(foe);
  }

  respawn(foe) {
    foe.reset();
    foe.firingTimer = 1 + Math.random() * 2;
    foe.minZ = -2 - Math.random();
    foe.speed = 1.5 + Math.random();
    foe.offset.set((Math.random() - 0.5), (Math.random() - 0.5), 0).multiplyScalar(2);
    foe.offset.y += 1.2;
    foe.offset.z = -16 - Math.random() * 16;
    foe.wiggle.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(32);
  }
}

export default Foes;
