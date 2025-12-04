// src/core/event-bus.ts
import { EventEmitter } from 'events';
// ═══════════════════════════════════════════════════════════════
//                      EVENT BUS CLASS
// ═══════════════════════════════════════════════════════════════
export class EventBus {
    emitter;
    subscriptions = new Map();
    eventHistory = [];
    maxHistorySize = 1000;
    subscriptionCounter = 0;
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100); // Allow many listeners
    }
    /**
     * Emit an event to all subscribers
     * Wrapped with error boundary to prevent crashes from handler errors
     */
    emit(event) {
        // Ensure timestamp
        if (!event.timestamp) {
            event.timestamp = new Date();
        }
        // Add to history
        this.addToHistory(event);
        // Emit to specific type listeners with error boundary
        try {
            this.emitter.emit(event.type, event);
        }
        catch (error) {
            console.error(`Error in event handler for ${event.type}:`, error);
        }
        // Emit to wildcard listeners with error boundary
        try {
            this.emitter.emit('*', event);
        }
        catch (error) {
            console.error(`Error in wildcard event handler for ${event.type}:`, error);
        }
    }
    /**
     * Subscribe to events of a specific type
     */
    on(eventType, handler) {
        const id = this.generateSubscriptionId();
        const subscription = {
            id,
            eventType,
            handler: handler,
            once: false,
        };
        this.subscriptions.set(id, subscription);
        this.emitter.on(eventType, handler);
        return id;
    }
    /**
     * Subscribe to a single occurrence of an event
     */
    once(eventType, handler) {
        const id = this.generateSubscriptionId();
        const wrappedHandler = (event) => {
            handler(event);
            this.off(id);
        };
        const subscription = {
            id,
            eventType,
            handler: wrappedHandler,
            once: true,
        };
        this.subscriptions.set(id, subscription);
        this.emitter.once(eventType, wrappedHandler);
        return id;
    }
    /**
     * Unsubscribe from events
     */
    off(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            return false;
        }
        this.emitter.off(subscription.eventType, subscription.handler);
        this.subscriptions.delete(subscriptionId);
        return true;
    }
    /**
     * Remove all listeners for a specific event type
     */
    removeAllListeners(eventType) {
        if (eventType) {
            this.emitter.removeAllListeners(eventType);
            // Clean up subscriptions map
            for (const [id, sub] of this.subscriptions.entries()) {
                if (sub.eventType === eventType) {
                    this.subscriptions.delete(id);
                }
            }
        }
        else {
            this.emitter.removeAllListeners();
            this.subscriptions.clear();
        }
    }
    /**
     * Get event history
     */
    getHistory(filter) {
        let events = [...this.eventHistory];
        if (filter?.eventType) {
            events = events.filter(e => e.type === filter.eventType);
        }
        if (filter?.since) {
            events = events.filter(e => e.timestamp >= filter.since);
        }
        if (filter?.limit) {
            events = events.slice(-filter.limit);
        }
        return events;
    }
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
    /**
     * Get subscription count
     */
    getSubscriptionCount(eventType) {
        if (eventType) {
            return this.emitter.listenerCount(eventType);
        }
        return this.subscriptions.size;
    }
    /**
     * Wait for a specific event (Promise-based)
     */
    waitFor(eventType, timeout, predicate) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            const handler = (event) => {
                if (!predicate || predicate(event)) {
                    if (timeoutId)
                        clearTimeout(timeoutId);
                    this.emitter.off(eventType, handler);
                    resolve(event);
                }
            };
            this.emitter.on(eventType, handler);
            if (timeout) {
                timeoutId = setTimeout(() => {
                    this.emitter.off(eventType, handler);
                    reject(new Error(`Timeout waiting for event: ${eventType}`));
                }, timeout);
            }
        });
    }
    /**
     * Create a typed event emitter helper
     */
    createTypedEmitter(eventType) {
        return {
            emit: (data, source) => {
                this.emit({
                    type: eventType,
                    timestamp: new Date(),
                    data,
                    source,
                });
            },
            on: (handler) => this.on(eventType, handler),
            once: (handler) => this.once(eventType, handler),
        };
    }
    // ═══════════════════════════════════════════════════════════════
    //                      PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════
    generateSubscriptionId() {
        return `sub_${++this.subscriptionCounter}_${Date.now()}`;
    }
    addToHistory(event) {
        this.eventHistory.push(event);
        // Trim history if needed
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
}
// ═══════════════════════════════════════════════════════════════
//                      SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════
let globalEventBus = null;
export function getGlobalEventBus() {
    if (!globalEventBus) {
        globalEventBus = new EventBus();
    }
    return globalEventBus;
}
export function resetGlobalEventBus() {
    if (globalEventBus) {
        globalEventBus.removeAllListeners();
        globalEventBus.clearHistory();
    }
    globalEventBus = null;
}
//# sourceMappingURL=event-bus.js.map