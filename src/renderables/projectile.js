import {
  BufferAttribute,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
} from 'three';

class Projectile extends Mesh {
  static setupGeometry() {
    const geometry = new IcosahedronGeometry(0.05, 2);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    const color = new BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3);
    let light;
    for (let i = 0; i < color.count; i++) {
      if (i % 3 === 0) {
        light = 1 - Math.random() * 0.1;
      }
      color.setXYZ(i, light, light, light);
    }
    geometry.setAttribute('color', color);
    Projectile.geometry = geometry;
  }

  static setupMaterial() {
    Projectile.material = new MeshBasicMaterial({ vertexColors: true });
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
