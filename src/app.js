import World from 'softxels';
import {
  Clock,
  Color,
  FogExp2,
  MathUtils,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import Dome from './renderables/dome.js';
import Input from './core/input.js';
import PostProcessing from './core/postprocessing.js';
import Projectiles from './renderables/projectiles.js';
import SFX from './core/sfx.js';
import Starfield from './renderables/starfield.js';
import Worker from './core/worker.js';
import Worldgen from 'web-worker:./core/worldgen.js';
import './app.css';

const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
const postprocessing = new PostProcessing({ samples: 2 });
const renderer = new WebGLRenderer();
const scene = new Scene();
renderer.outputEncoding = sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('renderer').appendChild(renderer.domElement);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  postprocessing.onResize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}, false);

const chunkMaterial = new MeshBasicMaterial({ vertexColors: true });
chunkMaterial.step = { value: 0 };
chunkMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.step = chunkMaterial.step;
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      [
        '#include <common>',
        'varying vec2 gridPosition;',
        'uniform float step;',
      ].join('\n')
    )
    .replace(
      '#include <begin_vertex>',
      [
        '#include <begin_vertex>',
        'vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;',
        'transformed.x *= 1.01 + sin(step * 2.0 * (1.0 - fract(wp.y))) * -0.01;',
        'transformed.x += sin(step * 4.0 * fract(wp.y)) * 0.2;',
        'gridPosition = wp.xz / 0.05;',
      ].join('\n')
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      [
        '#include <common>',
        'varying vec2 gridPosition;',
        'float line(vec2 position) {',
        '  vec2 coord = abs(fract(position - 0.5) - 0.5) / fwidth(position);',
        '  return 1.0 - min(min(coord.x, coord.y), 1.0);',
        '}',
      ].join('\n')
    )
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      [
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'diffuseColor.xyz += line(gridPosition) * 2.0;'
      ].join('\n')
    );
};

const world = new World({
  chunkSize: 32,
  chunkMaterial,
  renderRadius: 5,
  worldgen: (chunkSize) => new Worker({
    options: { chunkSize, seed:  Math.floor(Math.random() * 2147483647) },
    script: Worldgen,
  }), 
});
world.scale.setScalar(0.05);
scene.add(world);

const sfx = new SFX(camera);
scene.add(sfx);

const projectiles = new Projectiles({ sfx, world });
scene.add(projectiles);

const dome = new Dome();
scene.add(dome);

const starfield = new Starfield();
scene.add(starfield);

scene.background = (new Color(0.3, 0.4, 0.6)).convertSRGBToLinear().multiplyScalar(0.02);
scene.fog = new FogExp2(scene.background, 0.2);
Dome.material.uniforms.diffuse.value = scene.background;
Starfield.material.opacity = 0.8;

const clock = new Clock();
document.addEventListener('visibilitychange', () => {
  const isVisible = document.visibilityState === 'visible';
  if (isVisible) clock.start();
  if (sfx.listener) sfx.listener.setMasterVolume(isVisible ? 1 : 0);
}, false);
const fps = {
  count: 0,
  dom: document.getElementById('fps'),
  lastTick: clock.oldTime / 1000,
};
const input = new Input({ target: renderer.domElement });

camera.position.set(1, 0.8, 0);
camera.rotation.set(0, 0, 0, 'YXZ');
const anchor = new Vector3();
const offset = new Vector3(0, 0, world.renderRadius * world.chunkSize * -1).multiply(world.scale);
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  const time = clock.oldTime / 1000;

  camera.position.z -= delta;
  camera.rotation.y = MathUtils.damp(camera.rotation.y, input.pointer.x * Math.PI * -0.1, 5, delta);
  camera.rotation.x = MathUtils.damp(camera.rotation.x, (input.pointer.y + 0.5) * Math.PI * 0.125, 5, delta);
  
  dome.position.copy(camera.position);
  dome.position.y = 0;
  starfield.position.copy(dome.position);

  chunkMaterial.step.value += delta * 0.5;
  projectiles.onAnimationTick(delta);
  if (input.onAnimationTick(camera, time)) {
    projectiles.shoot(input.origin, input.direction);
  }

  world.updateChunks(anchor.addVectors(camera.position, offset));
  postprocessing.render(renderer, scene, camera);

  fps.count += 1;
  if (time >= fps.lastTick + 1) {
    const value = Math.round(fps.count / (time - fps.lastTick));
    if (fps.lastValue !== value) {
      fps.lastValue = value;
      fps.dom.innerText = `${value}fps`;
    }
    fps.lastTick = time;
    fps.count = 0;
  }
});
