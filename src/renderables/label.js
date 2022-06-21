import { FrontSide } from 'three';
import { Text } from 'troika-three-text';

class Label extends Text {
  constructor({ color, size, text }) {
    super();
    this.fontSize = size;
    this.outlineWidth = size / 10;
    this.anchorX = 'center';
    this.anchorY = 'middle';
    this.font = 'https://fonts.gstatic.com/s/vt323/v17/pxiKyp0ihIEF2hsb.woff';
    this.color = color;
    this.material[1].fog = false;
    this.material[1].side = FrontSide;
    this.material[1].transparent = true;
    this.text = text;
    this.sync();
  }
}

export default Label;
