import {
  ExtrudeBufferGeometry,
  Mesh,
  ShaderMaterial,
  ShaderLib,
  Shape,
  UniformsUtils,
  Vector3,
} from 'three';

class Powerup extends Mesh {
  static setupGeometry() {
    const geometry = new ExtrudeBufferGeometry([
      new Shape()
        .moveTo(25, 25)
        .bezierCurveTo(25, 25, 20, 0, 0, 0)
        .bezierCurveTo(-30, 0, -30, 35, -30, 35)
        .bezierCurveTo(-30, 55, -10, 77, 25, 95)
        .bezierCurveTo(60, 77, 80, 55, 80, 35)
        .bezierCurveTo(80, 35, 80, 0, 50, 0)
        .bezierCurveTo(35, 0, 25, 25, 25, 25)
    ], { depth: 50, bevelEnabled: false });
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry.rotateX(Math.PI);
    geometry.scale(0.005, 0.005, 0.005);
    geometry.center();
    Powerup.geometry = geometry;
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Powerup.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        time: { value: 0 },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec3 grid;',
            'uniform float time;',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            '#include <begin_vertex>',
            'grid = position / 0.1;',
            'transformed.xyz *= 1.05 + sin(time + (position.y + position.z) * 10.0) * 0.05;',
          ].join('\n')
        ),
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            '#include <common>',
            'varying vec3 grid;',
            'float line(const in vec3 position) {',
            '  float len = length(position.xy * 2.0);',
            '  vec3 coord = vec3(abs(fract(position.xz - 0.5) - 0.5) / fwidth(position.xz), abs(fract(len - 0.5) - 0.5) / fwidth(len));',
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
    });
    Powerup.material.uniforms.diffuse.value.setHex(0xEE0A0A);
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
    this.color = Powerup.material.uniforms.diffuse.value;
    this.time = 0;
    this.visible = false;
  }

  onBeforeRender() {
    const { material, rotation } = this;
    material.uniforms.time.value = rotation.y;
    material.uniformsNeedUpdate = true;
  }
}

export default Powerup;
