export type CCGEventType = 'session:start' | 'session:end' | 'session:pause' | 'session:resume' | 'task:create' | 'task:start' | 'task:progress' | 'task:complete' | 'task:fail' | 'task:pause' | 'guard:warning' | 'guard:block' | 'guard:pass' | 'resource:warning' | 'resource:critical' | 'resource:checkpoint' | 'resource:suggest:latent' | 'test:start' | 'test:complete' | 'test:fail' | 'memory:store' | 'memory:recall' | 'memory:forget' | 'process:spawn' | 'process:kill' | 'process:port-conflict' | 'document:create' | 'document:update' | 'document:register' | 'agent:registered' | 'agent:updated' | 'agent:removed' | 'agent:selected' | 'agent:coordination:created' | 'latent:context:created' | 'latent:context:updated' | 'latent:phase:transition' | 'latent:patch:applied' | 'latent:task:completed' | 'latent:validation:failed' | 'auto-agent:task:decomposed' | 'auto-agent:tool:routed' | 'auto-agent:fix:started' | 'auto-agent:fix:attempt' | 'auto-agent:fix:success' | 'auto-agent:fix:failed' | 'auto-agent:fix:rollback' | 'auto-agent:error:stored' | 'auto-agent:error:recalled' | 'taskgraph:created' | 'taskgraph:node:started' | 'taskgraph:node:completed' | 'taskgraph:node:failed' | 'taskgraph:completed' | 'rag:index:started' | 'rag:index:progress' | 'rag:index:complete' | 'rag:index:error' | 'rag:search:started' | 'rag:search:complete';
export interface CCGEvent<T = unknown> {
    type: CCGEventType;
    timestamp: Date;
    data?: T;
    source?: string;
    sessionId?: string;
}
export type EventHandler<T = unknown> = (event: CCGEvent<T>) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    eventType: CCGEventType | '*';
    handler: EventHandler;
    once: boolean;
}
export declare class EventBus {
    private emitter;
    private subscriptions;
    private eventHistory;
    private maxHistorySize;
    private subscriptionCounter;
    constructor();
    /**
     * Emit an event to all subscribers
     * Wrapped with error boundary to prevent crashes from handler errors
     */
    emit<T = unknown>(event: CCGEvent<T>): void;
    /**
     * Subscribe to events of a specific type
     */
    on<T = unknown>(eventType: CCGEventType | '*', handler: EventHandler<T>): string;
    /**
     * Subscribe to a single occurrence of an event
     */
    once<T = unknown>(eventType: CCGEventType | '*', handler: EventHandler<T>): string;
    /**
     * Unsubscribe from events
     */
    off(subscriptionId: string): boolean;
    /**
     * Remove all listeners for a specific event type
     */
    removeAllListeners(eventType?: CCGEventType): void;
    /**
     * Get event history
     */
    getHistory(filter?: {
        eventType?: CCGEventType;
        since?: Date;
        limit?: number;
    }): CCGEvent[];
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get subscription count
     */
    getSubscriptionCount(eventType?: CCGEventType): number;
    /**
     * Wait for a specific event (Promise-based)
     */
    waitFor<T = unknown>(eventType: CCGEventType, timeout?: number, predicate?: (event: CCGEvent<T>) => boolean): Promise<CCGEvent<T>>;
    /**
     * Create a typed event emitter helper
     */
    createTypedEmitter<T>(eventType: CCGEventType): {
        emit: (data: T, source?: string) => void;
        on: (handler: EventHandler<T>) => string;
        once: (handler: EventHandler<T>) => string;
    };
    private generateSubscriptionId;
    private addToHistory;
}
export declare function getGlobalEventBus(): EventBus;
export declare function resetGlobalEventBus(): void;
//# sourceMappingURL=event-bus.d.ts.map