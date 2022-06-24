import {
  BackSide,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
} from 'three';

class Effect extends Mesh {
  static setupGeometry() {
    const geometry = new BoxGeometry(0.5, 0.5, 0.5, 1, 1, 1);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    Effect.geometry = geometry;
  }

  constructor({ color, desktop }) {
    if (!Effect.geometry) {
      Effect.setupGeometry();
    }
    super(
      Effect.geometry,
      new MeshBasicMaterial({
        color,
        opacity: desktop.value,
        side: BackSide,
        transparent: true,
      })
    );
    this.renderOrder = 10;
    this.desktop = desktop;
    this.value = desktop.value;
    this.visible = false;
  }

  onAnimationTick(anchor, isXR, delta) {
    const { position, value } = this;
    if (value > 0) {
      this.update(Math.max(value - delta, 0));
    }
    this.visible = isXR;
    if (isXR) {
      position.copy(anchor);
    }
  }

  update(value) {
    const { desktop, material } = this;
    this.value = desktop.value = material.opacity = value;
  }
}

export default Effect;
