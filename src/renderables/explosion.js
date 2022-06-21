import {
  BufferAttribute,
  IcosahedronGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Mesh,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

class Explosion extends Mesh {
  static setupGeometry() {
    const sphere = new IcosahedronGeometry(0.5, 3);
    sphere.deleteAttribute('normal');
    sphere.deleteAttribute('uv');
    const scale = 1 / Explosion.chunks;
    sphere.scale(scale, scale, scale);
    {
      const { count } = sphere.getAttribute('position');
      const color = new BufferAttribute(new Float32Array(count * 3), 3);
      let light;
      for (let i = 0; i < count; i += 1) {
        if (i % 3 === 0) {
          light = 0.8 - Math.random() * 0.1;
        }
        color.setXYZ(i, light, light, light);
      }
      sphere.setAttribute('color', color);
    }
    const model = mergeVertices(sphere);
    const geometry = new InstancedBufferGeometry();
    geometry.setIndex(model.getIndex());
    geometry.setAttribute('position', model.getAttribute('position'));
    geometry.setAttribute('color', model.getAttribute('color'));
    const count = Explosion.chunks ** 3;
    const stride = 1 / Explosion.chunks;
    const offset = new Float32Array(count * 3);
    const direction = new Float32Array(count * 3);
    for (let v = 0, z = -0.5; z < 0.5; z += stride) {
      for (let y = -0.5; y < 0.5; y += stride) {
        for (let x = -0.5; x < 0.5; x += stride, v += 3) {
          direction[v] = Math.random() - 0.5;
          direction[v + 1] = Math.random() - 0.5;
          direction[v + 2] = Math.random() - 0.5;
          offset[v] = x;
          offset[v + 1] = y;
          offset[v + 2] = z;
        }
      }
    }
    geometry.setAttribute('direction', new InstancedBufferAttribute(direction, 3));
    geometry.setAttribute('offset', new InstancedBufferAttribute(offset, 3));
    Explosion.geometry = geometry;
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Explosion.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        step: { value: 0 },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'attribute vec3 direction;',
            'attribute vec3 offset;',
            'uniform float step;',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            'vec3 transformed = vec3( position * (2.0 - step * step * 2.0) + direction * step * 5.0 + offset );',
          ].join('\n')
        ),
      fragmentShader,
      vertexColors: true,
    });
  }

  constructor({ color, origin }) {
    if (!Explosion.geometry) {
      Explosion.setupGeometry();
    }
    if (!Explosion.material) {
      Explosion.setupMaterial();
    }
    super(
      Explosion.geometry,
      Explosion.material 
    );
    this.frustumCulled = false;
    this.color = color;
    this.position.copy(origin);
    this.rotation.set((Math.random() - 0.5) * Math.PI * 2, (Math.random() - 0.5) * Math.PI * 2, (Math.random() - 0.5) * Math.PI * 2);
    this.scale.setScalar(0.2);
    this.updateMatrixWorld();
    this.matrixAutoUpdate = false;
    this.step = 0;
  }

  onAnimationTick(delta) {
    const { step } = this;
    this.step = Math.min(step + delta * 3, 1);
    return this.step >= 1;
  }

  onBeforeRender() {
    const { color, material, step } = this;
    material.uniforms.diffuse.value.copy(color);
    material.uniforms.step.value = step;
    material.uniformsNeedUpdate = true;
  }
}

Explosion.chunks = 4;

export default Explosion;
