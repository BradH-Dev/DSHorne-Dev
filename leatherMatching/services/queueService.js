class PriorityQueue {
    constructor() {
      this.tasks = [];
      this.processing = false;
    }
    async enqueue(task, isPriority = false) {
      if (isPriority) this.tasks.unshift(task);
      else this.tasks.push(task);
      if (!this.processing) await this.processNext();
    }
    async processNext() {
      if (this.tasks.length === 0) {
        this.processing = false;
        return;
      }
      this.processing = true;
      const task = this.tasks.shift();
      try { await task(); } catch (e) { console.error('Error processing task:', e); }
      await this.processNext();
    }
  }
  module.exports = new PriorityQueue();
  