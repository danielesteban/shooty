import {
  BufferAttribute,
  Color,
  IcosahedronGeometry,
  Mesh,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
} from 'three';

class Projectile extends Mesh {
  static setupGeometry() {
    const geometry = new IcosahedronGeometry(0.25, 3);
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

  constructor() {
    if (!Projectile.geometry) {
      Projectile.setupGeometry();
    }
    if (!Projectile.material) {
      Projectile.setupMaterial();
    }
    super(Projectile.geometry, Projectile.material);
    this.color = new Color();
    this.direction = new Vector3();
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
