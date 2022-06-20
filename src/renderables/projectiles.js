import {
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import Explosion from './explosion.js';

const _air = { r: 255, g: 255, b: 127 };
const _chunk = new Vector3();
const _voxel = new Vector3();

class Projectiles extends Group {
  constructor({ sfx, world }) {
    super();
    this.matrixAutoUpdate = false;
    this.projectile = new Mesh(new IcosahedronGeometry(0.05, 2), new MeshBasicMaterial());
    this.sfx = sfx;
    this.world = world;
    this.explosions = [];
    this.projectiles = [];
  }
    
  onAnimationTick(delta) {
    const { explosions, projectiles, sfx, world } = this;
    const iterations = 10;
    const step = (20 / iterations) * delta;
    for (let c = 0, l = projectiles.length; c < l; c++) {
      const projectile = projectiles[c];
      for (let i = 0; i < iterations; i++) {
        projectile.position.addScaledVector(projectile.direction, step);
        projectile.distance += step;
        const hit = this.test(projectile.position);
        if (hit || projectile.distance > 100) {
          this.remove(projectile);
          projectiles.splice(c, 1);
          c--;
          l--;
          if (hit) {
            const r = 4 + Math.floor(Math.random() * 3);
            world.updateVolume(projectile.position, r, 0, _air);
            sfx.playAt('blast', projectile.position, 'lowpass', 1000 + Math.random() * 1000);
            const explosion = new Explosion(projectile.position);
            explosions.push(explosion);
            this.add(explosion);
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

  shoot(origin, direction) {
    const { projectiles, sfx } = this;
    sfx.playAt('shot', _voxel.addVectors(origin, direction), 'highpass', 1000 + Math.random() * 1000);
    const projectile = this.projectile.clone();
    projectile.direction = direction.clone();
    projectile.position.copy(origin).add(direction);
    projectile.distance = 0;
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
