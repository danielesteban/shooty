import { Vector2 } from 'three';
import Hand from '../renderables/hand.js';

class Input {
  constructor(renderer) {
    this.buttons = {
      primary: false,
      secondary: false,
      tertiary: false,
    };
    this.buttonState = { ...this.buttons };
    this.controllers = Array.from({ length: 2 }, (v, i) => {
      const controller = renderer.xr.getController(i);
      controller.buttons = {
        trigger: false,
        grip: false,
        primary: false,
        secondary: false,
        tertiary: false,
      };
      controller.joystick = new Vector2();
      controller.addEventListener('connected', (e) => {
        controller.gamepad = e.data.gamepad;
        controller.hand = new Hand({ handedness: e.data.handedness });
        controller.add(controller.hand);
      });
      controller.addEventListener('disconnected', () => {
        controller.remove(controller.hand);
        delete controller.gamepad;
        delete controller.hand;
      });
      return controller;
    });
    this.pointer = new Vector2();

    renderer.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this), false);
    renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), false);

    Input.setupCursor();
  }

  onAnimationTick(delta) {
    const { buttons, buttonState, controllers } = this;
    
    ['primary', 'secondary', 'tertiary'].forEach((button) => {
      const state = buttonState[button];
      buttons[`${button}Down`] = state && buttons[button] !== state;
      buttons[`${button}Up`] = !state && buttons[button] !== state;
      buttons[button] = state;
    });

    controllers.forEach(({ buttons, gamepad, hand, joystick }) => {
      if (!gamepad) {
        return;
      }
      [
        ['trigger', gamepad.buttons[0] && gamepad.buttons[0].pressed],
        ['grip', gamepad.buttons[1] && gamepad.buttons[1].pressed],
        ['primary', gamepad.buttons[4] && gamepad.buttons[4].pressed],
        ['secondary', gamepad.buttons[5] && gamepad.buttons[5].pressed],
        ['tertiary', gamepad.buttons[3] && gamepad.buttons[3].pressed],
        ['forwards', gamepad.axes[3] <= -0.75],
        ['backwards', gamepad.axes[3] >= 0.75],
        ['leftwards', gamepad.axes[2] <= -0.75],
        ['rightwards', gamepad.axes[2] >= 0.75],
      ].forEach(([key, value]) => {
        buttons[`${key}Down`] = value && buttons[key] !== value;
        buttons[`${key}Up`] = !value && buttons[key] !== value;
        buttons[key] = value;
      });
      hand.setFingers({
        thumb: gamepad.buttons[3] && gamepad.buttons[3].touched,
        index: gamepad.buttons[0] && gamepad.buttons[0].pressed,
        middle: gamepad.buttons[1] && gamepad.buttons[1].pressed,
      });
      hand.onAnimationTick(delta);
      joystick.set(
        Math.abs(gamepad.axes[2]) > 0.1 ? gamepad.axes[2] : 0,
        Math.abs(gamepad.axes[3]) > 0.1 ? -gamepad.axes[3] : 0
      );
    });
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onMouseDown({ button, clientX, clientY }) {
    const { buttonState } = this;
    switch (button) {
      case 0:
        buttonState.primary = true;
        break;
      case 1:
        buttonState.tertiary = true;
        break;
      case 2:
        buttonState.secondary = true;
        break;
      default:
        break;
    }
    this.onMouseMove({ clientX, clientY });
  }

  onMouseMove({ clientX, clientY }) {
    const { pointer } = this;
    pointer.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
  }

  onMouseUp({ button, clientX, clientY }) {
    const { buttonState } = this;
    switch (button) {
      case 0:
        buttonState.primary = false;
        break;
      case 1:
        buttonState.tertiary = false;
        break;
      case 2:
        buttonState.secondary = false;
        break;
      default:
        break;
    }
    this.onMouseMove({ clientX, clientY });
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
