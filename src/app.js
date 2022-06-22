import World from 'softxels';
import {
  Clock,
  Color,
  FogExp2,
  Group,
  MathUtils,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import Foes from './core/foes.js';
import Hud from './core/hud.js';
import Input from './core/input.js';
import Labels from './core/labels.js';
import PostProcessing from './core/postprocessing.js';
import Powerups from './core/powerups.js';
import Projectiles from './core/projectiles.js';
import SFX from './core/sfx.js';
import Worker from './core/worker.js';
import ChunkMaterial from './renderables/chunkmaterial.js';
import Dome from './renderables/dome.js';
import Label from './renderables/label.js';
import Starfield from './renderables/starfield.js';
import Worldgen from 'web-worker:./workers/worldgen.js';
import './app.css';

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
const postprocessing = new PostProcessing({ samples: 2 });
const renderer = new WebGLRenderer();
renderer.outputEncoding = sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('renderer').appendChild(renderer.domElement);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  postprocessing.onResize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}, false);

const scene = new Scene();
scene.background = (new Color(0.3, 0.4, 0.6)).convertSRGBToLinear().multiplyScalar(0.02);
scene.fog = new FogExp2(scene.background, 0.2);

const dome = new Dome();
scene.add(dome);
Dome.material.uniforms.diffuse.value = scene.background;

const starfield = new Starfield();
scene.add(starfield);

const world = new World({
  chunkMaterial: new ChunkMaterial(),
  chunkSize: 32,
  renderRadius: 5,
  worldgen: (chunkSize) => new Worker({
    options: { chunkSize, seed: Math.floor(Math.random() * 2147483647) },
    script: Worldgen,
  }), 
});
world.renderGrid = world.renderGrid.filter(({ x, y, z }) => (
  x >= -4 && x <= 4
  && y >= -1 && y <= 3
  && z >= -4 && z <= 4
));
world.scale.setScalar(0.05);
scene.add(world);

const hud = new Hud();

const labels = new Labels();
scene.add(labels);

const sfx = new SFX(camera);
scene.add(sfx);

const projectiles = new Projectiles({ sfx, world });
scene.add(projectiles);

const foes = new Foes({ count: 16, projectiles });
scene.add(foes);

const powerups = new Powerups({ count: 4, projectiles });
scene.add(powerups);

const gameOver = new Label({ size: 0.5, text: 'Game Over' });
gameOver.visible = false;
scene.add(gameOver);

const menu = new Group();
scene.add(menu);
{
  const title = new Label({ size: 0.8, text: 'Shooty' });
  menu.add(title);
  const play = new Label({ size: 0.2, text: 'Click to play' });
  play.position.set(0, -0.8, 0.8);
  menu.add(play);
}

let pauseTimer = 0;
const hurt = postprocessing.screen.material.uniforms.hurt;
projectiles.addEventListener('hit', ({ object, owner, point }) => {
  if (gameOver.visible) {
    return;
  }
  if (object === camera) {
    hurt.value = 0.5;
    hud.updateHealth(hud.health.value - 1);
    if (hud.health.value === 0) {
      gameOver.visible = true;
      pauseTimer = 3;
    }
  } else if (object.isFoe || object.isPowerup) {
    let score = 100;
    if (object.isFoe) {
      foes.respawn(object);
    } else {
      score = 50;
      object.visible = false;
    }
    if (owner === camera) {
      labels.spawn({ color: object.color, position: point, text: `${score}` });
      hud.updateScore(hud.score.value + score);
      if (object.isPowerup && hud.health.value < Hud.maxHealth) {
        hud.updateHealth(hud.health.value + 1);
      }
    }
  }
});
projectiles.targets.push(camera);

camera.position.set(1, 0.8, 0);
camera.rotation.set(0, 0, 0, 'YXZ');
const restart = () => {
  gameOver.visible = menu.visible = false;
  camera.position.z = 0;
  hud.reset();
  foes.reset();
  powerups.reset();
  world.reset();
};

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

const anchor = new Vector3();
const color = new Color();
const input = new Input({ target: renderer.domElement });
const offset = new Vector3(0, 0, world.renderRadius * world.chunkSize * -1).multiply(world.scale);

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  const time = clock.oldTime / 1000;
  const isPaused = gameOver.visible || menu.visible;

  if (isPaused) {
    anchor.set(0, 0.8 + Math.sin(time) * 0.2, -3).add(camera.position);
    gameOver.position.copy(anchor);
    menu.position.copy(anchor);
  } else {
    camera.position.z -= delta;
  }
  camera.rotation.y = MathUtils.damp(camera.rotation.y, input.pointer.x * Math.PI * -0.1, 5, delta);
  camera.rotation.x = MathUtils.damp(camera.rotation.x, input.pointer.y * Math.PI * 0.125, 5, delta);
  
  dome.position.copy(camera.position);
  dome.position.y = 0;
  starfield.position.copy(dome.position);

  foes.onAnimationTick(dome.position, camera.position, isPaused, delta, time);
  labels.onAnimationTick(delta);
  powerups.onAnimationTick(dome.position, delta, time);
  projectiles.onAnimationTick(delta);

  if (isPaused) {
    pauseTimer -= delta;
    if (input.isFiring && pauseTimer <= 0) {
      input.isFiring = false;
      restart();
    }
  } else if (input.onAnimationTick(camera, time)) {
    projectiles.shoot({
      color,
      direction: input.direction,
      origin: input.origin,
      owner: camera,
    });
  }

  if (hurt.value > 0) {
    hurt.value = Math.max(hurt.value - delta, 0);
  }
  world.chunkMaterial.uniforms.time.value = time;
  world.updateChunks(anchor.addVectors(camera.position, offset));
  postprocessing.render(renderer, scene, camera);

  if (!isPaused) {
    hud.updateTimer(time);
  }
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
