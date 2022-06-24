import { Group } from 'three';
import Label from '../renderables/label.js';

class Labels extends Group {
  constructor() {
    super();
    this.matrixAutoUpdate = false;
    this.pool = [];
  }
    
  onAnimationTick(delta) {
    const { children, pool } = this;
    for (let i = 0, l = children.length; i < l; i++) {
      const label = children[i];
      label.position.y += delta;
      label.material[1].opacity -= delta;
      if (label.material[1].opacity <= 0) {
        this.remove(label);
        pool.push(label);
        i--;
        l--;
      }
    }
  }

  spawn({ color, position, text }) {
    const { pool } = this;
    const label = pool.pop() || new Label({ size: 1 });
    label.color = color;
    label.material[1].opacity = 1;
    label.position.copy(position);
    label.text = text;
    label.sync();
    this.add(label);
  }
}

export default Labels;
