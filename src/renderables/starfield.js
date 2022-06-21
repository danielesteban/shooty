import {
  BufferGeometry,
  Points,
  BufferAttribute,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
} from 'three';

class Starfield extends Points {
  static setupGeometry() {
    const { count, radius } = Starfield;
    const position = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const aux = new Vector3();
    for (let i = 0; i < count; i += 1) {
      aux
        .set(
          (Math.random() - 0.5) * 2,
          0.1 + Math.random(),
          -Math.random()
        )
        .normalize()
        .multiplyScalar(radius);
      position.set([
        aux.x,
        aux.y,
        aux.z,
      ], i * 3);
      color.set([0.25 + Math.random() * 0.25, 0.25 + Math.random() * 0.25, 0.25 + Math.random() * 0.25], i * 3);
      size[i] = 1 + Math.random() * 8;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(position, 3));
    geometry.setAttribute('color', new BufferAttribute(color, 3));
    geometry.setAttribute('size', new BufferAttribute(size, 1));
    Starfield.geometry = geometry;
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.points;
    const material = new ShaderMaterial({
      uniforms: UniformsUtils.clone(uniforms),
      vertexShader: vertexShader.replace(
        'uniform float size;',
        'attribute float size;'
      ),
      fragmentShader,
      vertexColors: true,
      transparent: true,
    });
    material.color = material.uniforms.diffuse.value;
    material.opacity = 0.8;
    material.isPointsMaterial = true;
    material.sizeAttenuation = true;
    Starfield.material = material;
  }

  constructor() {
    if (!Starfield.geometry) {
      Starfield.setupGeometry();
    }
    if (!Starfield.material) {
      Starfield.setupMaterial();
    }
    super(
      Starfield.geometry,
      Starfield.material
    );
  }
}

Starfield.count = 5000;
Starfield.radius = 2000;

export default Starfield;
