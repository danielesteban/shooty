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
  static setupGeometry() {
    const geometries = [];
    {
      const geometry = new IcosahedronGeometry(0.1, 2);
      geometries.push(geometry);
    }
    {
      const geometry = new ConeGeometry(0.06, 0.2, 16);
      geometry.rotateZ(Math.PI * -0.5);
      geometry.translate(0.15, 0, 0);
      geometries.push(geometry.toNonIndexed());
    }
    {
      const geometry = new ConeGeometry(0.06, 0.2, 16);
      geometry.rotateZ(Math.PI * 0.5);
      geometry.translate(-0.15, 0, 0);
      geometries.push(geometry.toNonIndexed());
    }
    const merged = mergeBufferGeometries(geometries);
    const color = new BufferAttribute(new Float32Array(merged.getAttribute('position').count * 3), 3);
    let light;
    for (let i = 0; i < color.count; i++) {
      if (i % 3 === 0) {
        light = 1 - Math.random() * 0.5;
      }
      color.setXYZ(i, light, light, light);
    }
    merged.setAttribute('color', color);
    const geometry = mergeVertices(merged);
    geometry.scale(0.5, 0.5, 0.5);
    Foe.geometry = geometry;
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
            'varying vec2 gridPosition;',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            '#include <begin_vertex>',
            'gridPosition = position.xz / 0.02;',
          ].join('\n')
        ),
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec2 gridPosition;',
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
            'diffuseColor.xyz *= 1.0 + line(gridPosition);'
          ].join('\n')
        ),
      fog: true,
      vertexColors: true,
    });
  }

  constructor() {
    if (!Foe.geometry) {
      Foe.setupGeometry();
    }
    if (!Foe.material) {
      Foe.setupMaterial();
    }
    super(Foe.geometry, Foe.material);
    this.isFoe = true;
    this.color = (new Color()).setHSL(Math.random(), 0.4 + Math.random() * 0.2, 0.4 + Math.random() * 0.2).convertSRGBToLinear();
    this.offset = new Vector3();
    this.rotation.set(0, 0, 0, 'ZXY');
  }

  onBeforeRender() {
    const { color, material } = this;
    material.uniforms.diffuse.value.copy(color);
    material.uniformsNeedUpdate = true;
  }
}

export default Foe;
