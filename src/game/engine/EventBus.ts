export type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    const idx = cbs.indexOf(callback);
    if (idx !== -1) cbs.splice(idx, 1);
  }

  emit(event: string, ...args: unknown[]): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    for (const cb of [...cbs]) {
      cb(...args);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
