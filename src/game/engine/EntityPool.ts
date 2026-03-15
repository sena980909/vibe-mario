export class EntityPool<T extends { active: boolean; reset(...args: unknown[]): void }> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 20) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get(): T {
    const found = this.pool.find(o => !o.active);
    if (found) return found;
    const obj = this.factory();
    this.pool.push(obj);
    return obj;
  }

  release(obj: T): void {
    obj.active = false;
  }

  getActive(): T[] {
    return this.pool.filter(o => o.active);
  }

  getPool(): T[] {
    return this.pool;
  }
}
