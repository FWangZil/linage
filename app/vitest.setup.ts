import '@testing-library/jest-dom/vitest';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect(): void {}

  observe(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(): void {}
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

HTMLCanvasElement.prototype.getContext = (() => {
  return {
    canvas: document.createElement('canvas'),
    clearRect() {},
    fillRect() {},
    getImageData() {
      return { data: new Uint8ClampedArray() } as ImageData;
    },
    putImageData() {},
    createImageData() {
      return { data: new Uint8ClampedArray() } as ImageData;
    },
    setTransform() {},
    drawImage() {},
    save() {},
    fillText() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    translate() {},
    scale() {},
    rotate() {},
    arc() {},
    fill() {},
    measureText() {
      return { width: 0 } as TextMetrics;
    },
    transform() {},
    rect() {},
    clip() {},
  } as unknown as CanvasRenderingContext2D;
}) as typeof HTMLCanvasElement.prototype.getContext;
