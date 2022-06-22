import {
  BoxGeometry,
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from 'three';

class Powerup extends Mesh {
  static setupGeometry() {
    const geometry = new BoxGeometry(0.1, 0.1, 0.1, 8, 8, 8).toNonIndexed();
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    const color = new BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3);
    let light;
    for (let i = 0; i < color.count; i++) {
      if (i % 6 === 0) {
        light = 1 - Math.random() * 0.5;
      }
      color.setXYZ(i, light, light, light);
    }
    geometry.setAttribute('color', color);
    Powerup.geometry = geometry;
  }

  static setupMaterial() {
    Powerup.material = new MeshBasicMaterial({ color: 0x990F0F, vertexColors: true });
  }

  constructor() {
    if (!Powerup.geometry) {
      Powerup.setupGeometry();
    }
    if (!Powerup.material) {
      Powerup.setupMaterial();
    }
    super(Powerup.geometry, Powerup.material);
    this.isPowerup = true;
    this.color = this.material.color;
    this.visible = false;
  }
}

export default Powerup;
