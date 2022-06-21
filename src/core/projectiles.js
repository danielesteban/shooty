import { Group, Vector3 } from 'three';
import Explosion from '../renderables/explosion.js';
import Projectile from '../renderables/projectile.js';

const _air = { r: 255, g: 255, b: 127 };
const _chunk = new Vector3();
const _voxel = new Vector3();

class Projectiles extends Group {
  constructor({ sfx, world }) {
    super();
    this.matrixAutoUpdate = false;
    this.sfx = sfx;
    this.world = world;
    this.explosions = [];
    this.projectiles = [];
    this.targets = [];
  }
    
  onAnimationTick(delta) {
    const { explosions, projectiles, targets, world } = this;
    const iterations = 2;
    const step = (20 / iterations) * delta;
    for (let p = 0, l = projectiles.length; p < l; p++) {
      const projectile = projectiles[p];
      for (let i = 0; i < iterations; i++) {
        projectile.onAnimationTick(step);
        let hit = this.test(projectile.position) && world;
        if (!hit && i === 0) {
          hit = targets.find((target) => projectile.position.distanceTo(target.position) < 0.2);
        }
        if (hit || projectile.distance > 100) {
          this.remove(projectile);
          projectiles.splice(p, 1);
          p--;
          l--;
          if (hit) {
            this.blast({
              color: hit.color || projectile.color,
              origin: projectile.position,
              radius: 4 + Math.floor(Math.random() * 3),
            });
            this.dispatchEvent({ type: 'hit', point: projectile.position, object: hit });
          }
          break;
        }
      }
    }
    for (let i = 0, l = explosions.length; i < l; i++) {
      const explosion = explosions[i];
      if (explosion.onAnimationTick(delta)) {
        this.remove(explosion);
        explosions.splice(i, 1);
        i--;
        l--;
      }
    }
  }

  blast({ color, origin, radius }) {
    const { explosions, sfx, world } = this;
    world.updateVolume(origin, radius, 0, _air);
    sfx.playAt('blast', origin, 'lowpass', 1000 + Math.random() * 1000);
    const explosion = new Explosion({ color, origin });
    explosions.push(explosion);
    this.add(explosion);
  }

  shoot({ color, direction, origin }) {
    const { projectiles, sfx } = this;
    sfx.playAt('shot', _voxel.addVectors(origin, direction), 'highpass', 1000 + Math.random() * 1000);
    const projectile = new Projectile({ color, direction, origin });
    projectiles.push(projectile);
    this.add(projectile);
  }

  test(position) {
    const { world } = this;
    world.worldToLocal(_voxel.copy(position)).round();
    _chunk.copy(_voxel).divideScalar(world.chunkSize).floor();
    const data = world.dataChunks.get(`${_chunk.x}:${_chunk.y}:${_chunk.z}`);
    if (!data) {
      return false;
    }
    _voxel.sub(_chunk.multiplyScalar(world.chunkSize));
    return data[
      (_voxel.z * world.chunkSize * world.chunkSize + _voxel.y * world.chunkSize + _voxel.x) * 4
    ] >= 0x80;
  }
}

export default Projectiles;
