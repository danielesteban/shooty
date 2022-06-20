class Worker {
  constructor({
    concurrency = navigator.hardwareConcurrency || 1,
    options,
    script,
  }) {
    this.queue = [];
    this.instances = Array.from({ length: concurrency }, () => {
      const worker = new script();
      worker.isBusy = true;
      worker.run = ({ operation, resolve }) => {
        worker.isBusy = true;
        worker.resolve = resolve;
        worker.postMessage(operation);
      };
      const onLoad = () => {
        worker.removeEventListener('message', onLoad);
        worker.addEventListener('message', onData);
        const queued = this.queue.shift();
        if (queued) {
          worker.run(queued);
        } else {
          worker.isBusy = false;
        }
      };
      const onData = ({ data }) => {
        const { resolve } = worker;
        delete worker.resolve;
        resolve(data);
        const queued = this.queue.shift();
        if (queued) {
          worker.run(queued);
        } else {
          worker.isBusy = false;
        }
      };
      worker.addEventListener('message', onLoad);
      worker.postMessage(options);
      return worker;
    });
  }

  dispose() {
    const { instances } = this;
    instances.forEach((instance) => instance.terminate());
  }

  run(operation) {
    const { instances, queue } = this;
    return new Promise((resolve) => {
      let worker;
      for (let i = 0, l = instances.length; i < l; i++) {
        if (!instances[i].isBusy) {
          worker = instances[i];
          break;
        }
      }
      if (!worker) {
        queue.push({ operation, resolve });
        return;
      }
      worker.run({ operation, resolve });
    });
  }
}

export default Worker;
