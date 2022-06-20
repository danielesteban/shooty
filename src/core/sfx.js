import {
  Audio,
  AudioListener,
  AudioLoader,
  Group,
  PositionalAudio,
} from 'three';

class SFX extends Group {
  constructor(head) {
    super();
    const loader = new AudioLoader();
    this.pools = {};
    Promise.all([
      ...[
        'https://cdn.glitch.global/86d98710-81ec-4249-b9ad-eb879e6ff8e3/ambient.ogg?v=1655649673221',
        'https://cdn.glitch.global/bc15c731-6015-4f5e-ad16-e41a29ceb25c/blast.ogg?v=1655343214300',
        'https://cdn.glitch.global/bc15c731-6015-4f5e-ad16-e41a29ceb25c/shot.ogg?v=1655343225893',
      ].map((url) => (
        new Promise((resolve, reject) => loader.load(url, resolve, null, reject))
      )),
      new Promise((resolve) => {
        const onFirstInteraction = () => {
          window.removeEventListener('keydown', onFirstInteraction);
          window.removeEventListener('mousedown', onFirstInteraction);
          resolve();
        };
        window.addEventListener('keydown', onFirstInteraction, false);
        window.addEventListener('mousedown', onFirstInteraction, false);
      }),
    ])
      .then(([ambient, blast, shot]) => {
        const listener = new AudioListener();
        head.add(listener);
        const getPool = (buffer, pool) => (
         Array.from({ length: pool }, () => {
            const sound = new PositionalAudio(listener);
            sound.matrixAutoUpdate = false;
            sound.setBuffer(buffer);
            sound.filter = new BiquadFilterNode(listener.context);
            sound.setFilter(sound.filter);
            sound.setRefDistance(8);
            sound.setVolume(0.4);
            this.add(sound);
            return sound;
          })
        );
        this.ambient = new Audio(listener);
        this.ambient.setBuffer(ambient);
        this.ambient.setLoop(true);
        this.ambient.play();
        this.listener = listener;
        this.pools.blast = getPool(blast, 16);
        this.pools.shot = getPool(shot, 16);
      });
  }
  
  playAt(id, position, filter, frequency) {
    const { pools } = this;
    const pool = pools[id];
    if (!pool) {
      return;
    }
    const sound = pools[id].find(({ isPlaying }) => !isPlaying);
    if (!sound) {
      return;
    }
    sound.filter.type = filter;
    sound.filter.frequency.value = Math.round(frequency);
    sound.position.copy(position);
    sound.updateMatrix();
    sound.play(sound.listener.timeDelta);
  }
}

export default SFX;
