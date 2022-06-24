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
import Effect from './renderables/effect.js';
import Label from './renderables/label.js';
import Starfield from './renderables/starfield.js';
import Worldgen from 'web-worker:./workers/worldgen.js';
import './app.css';

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const postprocessing = new PostProcessing({ samples: 2 });
const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.outputEncoding = sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('renderer').appendChild(renderer.domElement);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  postprocessing.onResize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}, false);

const background = {};
background.linear = (new Color(0.3, 0.4, 0.6)).convertSRGBToLinear().multiplyScalar(0.02);
background.srgb = background.linear.clone().convertLinearToSRGB();
const scene = new Scene();
scene.background = background.linear;
scene.fog = new FogExp2(background.linear, 0.025);

const player = new Group();
player.head = new Vector3();
player.position.set(8, 2, 0);
camera.position.set(0, 1.6, 0);
camera.rotation.set(0, 0, 0, 'YXZ');
player.add(camera);
scene.add(player);

const dome = new Dome();
scene.add(dome);
Dome.material.uniforms.diffuse.value = background.linear;

const starfield = new Starfield();
scene.add(starfield);

const world = new World({
  chunkMaterial: new ChunkMaterial(),
  chunkSize: 32,
  renderRadius: 4,
  worldgen: (chunkSize) => new Worker({
    options: { chunkSize, seed: Math.floor(Math.random() * 2147483647) },
    script: Worldgen,
  }), 
});
world.renderGrid = world.renderGrid.filter(({ x, y, z }) => (
  x >= -3 && x <= 3
  && y >= -1 && y <= 3
  && z >= -3 && z <= 3
));
world.scale.setScalar(0.5);
scene.add(world);

const hud = new Hud();

const labels = new Labels();
scene.add(labels);

const sfx = new SFX();
scene.add(sfx);

const projectiles = new Projectiles({ sfx, world });
scene.add(projectiles);

const foes = new Foes({ count: 12, projectiles });
scene.add(foes);

const powerups = new Powerups({ count: 4, projectiles });
scene.add(powerups);

const gameOver = new Label({ size: 4, text: 'Game Over' });
gameOver.visible = false;
scene.add(gameOver);

const menu = new Label({ size: 6, text: 'Shooty' });
scene.add(menu);

const hurt = new Effect({
  color: 0xFF0000,
  desktop: postprocessing.screen.material.uniforms.hurt,
});
scene.add(hurt);
let pauseTimer = 0;
projectiles.addEventListener('hit', ({ color, object, owner, point }) => {
  if (gameOver.visible) {
    return;
  }
  if (object === player) {
    hurt.update(0.5);
    hud.updateHealth(hud.health.value - 1);
    if (hud.health.value === 0) {
      gameOver.visible = true;
      pauseTimer = 3;
    }
  } else if (object.isFoe || object.isPowerup) {
    object.visible = false;
    if (owner === player) {
      const score = object.isFoe ? 100 : 50;
      labels.spawn({ color, position: point, text: `${score}` });
      hud.updateScore(hud.score.value + score);
      if (object.isPowerup && hud.health.value < Hud.maxHealth) {
        hud.updateHealth(hud.health.value + 1);
      }
    }
  }
});
projectiles.targets.push(player);

const input = new Input(renderer);
const color = new Color();
const direction = new Vector3();
const origin = new Vector3();
const lastShot = new WeakMap();

const debounce = (object, time) => {
  if (time >= (lastShot.get(object) || 0) + 0.06) {
    lastShot.set(object, time);
    return true;
  }
  return false;
};

const restart = () => {
  gameOver.visible = menu.visible = false;
  player.position.z = 0;
  hud.reset();
  foes.reset();
  powerups.reset();
  world.reset();
};

const processInput = (isPaused, delta, time) => {
  const firing = [];

  input.onAnimationTick(delta);

  if (renderer.xr.isPresenting) {
    input.controllers.forEach((controller) => {
      if (!controller.hand) {
        return;
      }
      if (controller.buttons.secondaryDown) {
        Promise.resolve().then(() => xr.getSession().end());
      }
      if (controller.buttons.trigger && debounce(controller, time)) {
        lastShot.set(controller, time);
        firing.push({ object: controller });
      }
    });
  } else if (input.buttons.primary && debounce(camera, time)) {
    firing.push({ object: camera, offset: 8, pointer: input.pointer });
  }

  if (isPaused) {
    pauseTimer -= delta;
    if (firing.length && pauseTimer <= 0) {
      restart();
    }
  } else {
    firing.forEach(({ object, offset, pointer }) => {
      origin.setFromMatrixPosition(object.matrixWorld);
      if (pointer) {
        direction.set(pointer.x, pointer.y, 0.5).unproject(object).sub(origin).normalize();
      } else {
        object.getWorldDirection(direction).negate();
      }
      projectiles.shoot({
        color,
        direction,
        offset,
        origin,
        owner: player,
      });
    });
  }
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
const offset = new Vector3(0, 0, world.renderRadius * world.chunkSize * -1).multiply(world.scale);
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  const time = clock.oldTime / 1000;
  const isPaused = gameOver.visible || menu.visible;

  if (isPaused) {
    anchor.set(0, 4 + Math.sin(time * 0.75), -16).add(player.position);
    gameOver.position.copy(anchor);
    menu.position.copy(anchor);
  } else {
    player.position.z -= delta * 10;
  }
  dome.position.copy(player.position);
  starfield.position.copy(player.position);

  player.updateMatrixWorld();
  if (renderer.xr.isPresenting) {
    renderer.xr.updateCamera(camera);
    renderer.xr.getCamera().getWorldPosition(player.head);
  } else {
    camera.getWorldPosition(player.head);
    camera.rotation.y = MathUtils.damp(camera.rotation.y, input.pointer.x * Math.PI * -0.1, 5, delta);
    camera.rotation.x = MathUtils.damp(camera.rotation.x, input.pointer.y * Math.PI * 0.2, 5, delta);
  }

  foes.onAnimationTick(player.position, player.head, isPaused, delta, time);
  labels.onAnimationTick(delta);
  powerups.onAnimationTick(player.position, time);
  projectiles.onAnimationTick(delta);
  processInput(isPaused, delta, time);

  hurt.onAnimationTick(player.head, renderer.xr.isPresenting, delta);
  world.chunkMaterial.uniforms.time.value = time;
  world.updateChunks(anchor.addVectors(player.position, offset));
  if (renderer.xr.isPresenting) {
    renderer.render(scene, camera);
  } else {
    postprocessing.render(renderer, scene, camera);
  }

  if (sfx.listener) {
    (renderer.xr.isPresenting ? renderer.xr.getCamera() : camera)
      .matrixWorld
      .decompose(sfx.listener.position, sfx.listener.quaternion, sfx.listener.scale);
    sfx.listener.updateMatrixWorld();
  }
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

if (navigator.xr) {
  const onEnterVR = () => {
    scene.background = scene.fog.color = background.srgb;
    input.controllers.forEach((controller) => (
      player.add(controller)
    ));
  };
  const onExitVR = () => {
    scene.background = scene.fog.color = background.linear;
    camera.position.set(0, 1.6, 0);
    camera.rotation.set(0, 0, 0, 'YXZ');
    input.controllers.forEach((controller) => (
      player.remove(controller)
    ));
  };
  renderer.xr.enabled = true;
  renderer.xr.cameraAutoUpdate = false;
  navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    if (!supported) {
      return;
    }
    const vr = document.getElementById('vr');
    const [label] = vr.getElementsByTagName('span');
    vr.classList.add('enabled');
    label.innerText = 'Enter VR';
    let currentSession = null;
    const onSessionEnded = () => {
      currentSession.removeEventListener('end', onSessionEnded);
      currentSession = null;
      label.innerText = 'Enter VR';
      onExitVR();
    };
    vr.addEventListener('click', () => {
      if (currentSession) {
        currentSession.end();
        return;
      }
      navigator.xr
        .requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })
        .then((session) => {
          session.addEventListener('end', onSessionEnded);
          renderer.xr.setSession(session)
            .then(() => {
              currentSession = session;
              label.innerText = 'Exit VR';
              onEnterVR();
            });
        });
    }, false);
  });
}
