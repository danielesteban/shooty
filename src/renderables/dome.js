import {
  BackSide,
  CanvasTexture,
  Color,
  Mesh,
  RedFormat,
  RepeatWrapping,
  ShaderLib,
  ShaderMaterial,
  SphereGeometry,
  UniformsUtils,
} from 'three';

const Noise = (size = 256) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const n = Math.floor(Math.random() * 256);
    pixels.data.set([n, n, n, 0xFF], i);
  }
  ctx.putImageData(pixels, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.format = RedFormat;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
};

class Dome extends Mesh {
  static setupGeometry() {
    const geometry = new SphereGeometry(1000, 16, 16, Math.PI * 0.9, Math.PI * 1.2, 0, Math.PI * 0.5);
    geometry.deleteAttribute('normal');
    Dome.geometry = geometry;
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Dome.material = new ShaderMaterial({
      side: BackSide,
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        diffuse: { value: new Color(0x224466) },
        noise: { value: Noise() },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            'varying float vAltitude;',
            'varying vec2 vNoiseUV;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          'include <fog_vertex>',
          [
            'include <fog_vertex>',
            'vAltitude = clamp(normalize(position).y, 0.0, 1.0);',
            'vNoiseUV = uv * 2.0;',
            'gl_Position = gl_Position.xyww;',
          ].join('\n')
        ),
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            'varying float vAltitude;',
            'varying vec2 vNoiseUV;',
            'uniform sampler2D noise;',
            'const float granularity = 0.3 / 255.0;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          [
            'vec4 diffuseColor = vec4( mix(diffuse, diffuse * 1.5, vAltitude), opacity );',
            'diffuseColor.rgb += mix(-granularity, granularity, texture(noise, vNoiseUV).r);',
          ].join('\n')
        ),
    });
  }

  constructor() {
    if (!Dome.geometry) {
      Dome.setupGeometry();
    }
    if (!Dome.material) {
      Dome.setupMaterial();
    }
    super(
      Dome.geometry,
      Dome.material
    );
    this.renderOrder = 10;
  }
}

export default Dome;
