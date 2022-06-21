import {
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
} from 'three';

class Projectile extends Mesh {
  static setupGeometry() {
    const geometry = new IcosahedronGeometry(0.05, 2);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    Projectile.geometry = geometry;
  }

  static setupMaterial() {
    Projectile.material = new MeshBasicMaterial();
  }

  constructor({ color, direction, origin }) {
    if (!Projectile.geometry) {
      Projectile.setupGeometry();
    }
    if (!Projectile.material) {
      Projectile.setupMaterial();
    }
    super(Projectile.geometry, Projectile.material);
    this.color = color;
    this.position.copy(origin).add(direction);
    this.direction = direction.clone();
    this.distance = 0;
  }

  onAnimationTick(step) {
    const { position, direction } = this;
    position.addScaledVector(direction, step);
    this.distance += step;
  }

  onBeforeRender() {
    const { color, material } = this;
    material.color.copy(color);
  }
}

export default Projectile;
