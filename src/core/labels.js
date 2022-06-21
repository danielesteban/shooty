import { Group } from 'three';
import Label from '../renderables/label.js';

class Labels extends Group {
  constructor() {
    super();
    this.matrixAutoUpdate = false;
  }
    
  onAnimationTick(delta) {
    const { children } = this;
    for (let i = 0, l = children.length; i < l; i++) {
      const label = children[i];
      label.position.y += delta * 0.1;
      label.material[1].opacity -= delta;
      if (label.material[1].opacity <= 0) {
        this.remove(label);
        label.dispose();
        i--;
        l--;
      }
    }
  }

  spawn(color, position, text) {
    const label = new Label({ color, size: 0.1, text });
    label.position.copy(position);
    this.add(label);
  }
}

export default Labels;
