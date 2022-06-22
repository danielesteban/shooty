import {
  ShaderMaterial,
  ShaderLib,
  UniformsUtils,
} from 'three';

class ChunkMaterial extends ShaderMaterial {
  constructor() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    super({
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
            'vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;',
            'grid = wp.xz / 0.05;',
            'float d = sin(time + round(max(wp.y, 0.0) * wp.x));',
            'transformed.x += d;',
            'transformed.z -= d;',
          ].join('\n')
        ),
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec2 grid;',
            'float line(const in vec2 position) {',
            '  vec2 coord = abs(fract(position - 0.5) - 0.5) / fwidth(position);',
            '  return 1.0 - min(min(coord.x, coord.y), 1.0);',
            '}',
          ].join('\n')
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          [
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            'diffuseColor.xyz += line(grid) * 2.0;'
          ].join('\n')
        ),
      fog: true,
      vertexColors: true,
    });
  }
}

export default ChunkMaterial;
