import { Vector2, Vector3 } from 'three';

class Input {
  constructor({ target }) {
    this.direction = new Vector3();
    this.isFiring = false;
    this.lastShot = 0;
    this.pointer = new Vector2();
    this.origin = new Vector3();

    target.addEventListener('contextmenu', this.onContextMenu.bind(this), false);
    target.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), false);

    Input.setupCursor();
  }

  onAnimationTick(camera, time) {
    const { direction, isFiring, lastShot, origin, pointer } = this;
    if (isFiring && time >= lastShot + 0.06) {
      this.lastShot = time;
      origin.setFromMatrixPosition(camera.matrixWorld);
      direction.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(origin).normalize();
      return true;
    }
    return false;
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onMouseDown({ button, clientX, clientY }) {
    if (button === 0) {
      this.isFiring = true;
      this.onMouseMove({ clientX, clientY });
    }
  }

  onMouseMove({ clientX, clientY }) {
    const { pointer } = this;
    pointer.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
  }

  onMouseUp() {
    this.isFiring = false;
  }

  static setupCursor() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 20;
    canvas.height = 20;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#111';
    ctx.arc(canvas.width * 0.5, canvas.height * 0.5, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#eee';
    ctx.stroke();
    canvas.toBlob((blob) => {
      document.body.style.cursor = `url(${URL.createObjectURL(blob)}) 10 10, default`;
    });
  }
}

export default Input;
