import {
  BufferAttribute,
  IcosahedronGeometry,
  Mesh,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
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
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Projectile.material = new ShaderMaterial({
      uniforms: UniformsUtils.clone(uniforms),
      vertexShader,
      fragmentShader,
      fog: true,
      vertexColors: true,
    });
  }

  constructor({ color, direction, origin, owner }) {
    if (!Projectile.geometry) {
      Projectile.setupGeometry();
    }
    if (!Projectile.material) {
      Projectile.setupMaterial();
    }
    super(Projectile.geometry, Projectile.material);
    this.color = color;
    this.owner = owner;
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
    material.uniforms.diffuse.value.copy(color);
    material.uniformsNeedUpdate = true;
  }
}

export default Projectile;
