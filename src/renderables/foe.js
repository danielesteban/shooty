import {
  BufferAttribute,
  Color,
  ConeGeometry,
  IcosahedronGeometry,
  Mesh,
  ShaderMaterial,
  ShaderLib,
  UniformsUtils,
  Vector3,
} from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

class Foe extends Mesh {
  static setupModels() {
    Foe.models = Array.from({ length: 4 }, (v, model) => {
      const geometries = [];
      const push = (geometry, light = 1) => {
        geometry.deleteAttribute('normal');
        geometry.deleteAttribute('uv');
        if (geometry.index) {
          geometry = geometry.toNonIndexed();
        }
        const color = new BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3);
        let l;
        for (let i = 0; i < color.count; i++) {
          if (i % 3 === 0) {
            l = (1 - Math.random() * 0.5) * light;
          }
          color.setXYZ(i, l, l, l);
        }
        geometry.setAttribute('color', color);
        geometries.push(geometry);
        return geometry;
      };
      push(new IcosahedronGeometry(0.05, 2));
      switch (model) {
        case 1:
          for (let x = -1; x <= 1; x += 2) {
            const geometry = push(new ConeGeometry(0.03, 0.1, 8, 16), 0.75);
            geometry.rotateZ(Math.PI * 0.5 * -x);
            geometry.translate(0.075 * x, 0, 0);
          }
          break;
        case 2:
        case 3: {
          const geometry = push(new ConeGeometry(0.03, 0.1, 8, 16), 0.75);
          if (model === 3) {
            geometry.rotateZ(Math.PI);
          }
          geometry.translate(0, 0.075 * (model === 3 ? -1 : 1), 0);
          break;
        }
      }
      return mergeVertices(mergeBufferGeometries(geometries));
    });
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Foe.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        time: { value: 0 },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec2 grid;',
            'uniform float time;',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            '#include <begin_vertex>',
            'grid = position.xz / 0.02;',
            'float d = sin(time + (position.x + position.y) * 100.0) * 0.05;',
            'transformed.xyz *= 1.0 + d;',
            'transformed.y += sin(time * 2.0) * (position.x * position.x);',
          ].join('\n')
        ),
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec2 grid;',
            'float line(const in vec2 position) {',
            '  float len = length(position);',
            '  vec3 coord = vec3(abs(fract(position - 0.5) - 0.5) / fwidth(position), abs(fract(len - 0.5) - 0.5) / fwidth(len));',
            '  return 1.0 - min(min(min(coord.x, coord.y), coord.z), 1.0);',
            '}',
          ].join('\n')
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          [
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            'diffuseColor.xyz *= 1.0 + line(grid);'
          ].join('\n')
        ),
      fog: true,
      vertexColors: true,
    });
  }

  constructor() {
    if (!Foe.models) {
      Foe.setupModels();
    }
    if (!Foe.material) {
      Foe.setupMaterial();
    }
    super(undefined, Foe.material);
    this.isFoe = true;
    this.color = new Color();
    this.offset = new Vector3();
    this.rotation.set(0, 0, 0, 'ZXY');
  }

  onBeforeRender() {
    const { color, material } = this;
    material.uniforms.diffuse.value.copy(color);
    material.uniformsNeedUpdate = true;
  }

  reset() {
    const { color, scale } = this;
    this.geometry = Foe.models[Math.floor(Math.random() * Foe.models.length)];
    color.setHSL(Math.random(), 0.4 + Math.random() * 0.2, 0.4 + Math.random() * 0.2).convertSRGBToLinear();
    scale.setScalar(1 + Math.random());
  }
}

export default Foe;
