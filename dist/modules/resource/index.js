// src/modules/resource/index.ts
import { ResourceService } from './resource.service.js';
import { getResourceTools } from './resource.tools.js';
export class ResourceModule {
    service;
    constructor(config, eventBus, logger, projectRoot) {
        this.service = new ResourceService(config, eventBus, logger, projectRoot);
    }
    async initialize() {
        await this.service.initialize();
    }
    getTools() {
        return getResourceTools();
    }
    async handleTool(toolName, args) {
        switch (toolName) {
            case 'resource_status':
                return this.service.getStatus();
            case 'resource_update_tokens':
                return this.service.updateTokenUsage(args.used, args.estimated);
            case 'resource_estimate_task':
                return this.service.estimateTask({
                    description: args.description,
                    filesCount: args.filesCount,
                    linesEstimate: args.linesEstimate,
                    hasTests: args.hasTests,
                    hasBrowserTesting: args.hasBrowserTesting,
                });
            case 'resource_checkpoint_create':
                return this.service.createCheckpoint({
                    name: args.name,
                    reason: args.reason || 'manual',
                });
            case 'resource_checkpoint_list':
                return this.service.listCheckpoints();
            case 'resource_checkpoint_restore':
                return this.service.restoreCheckpoint(args.checkpointId);
            case 'resource_checkpoint_delete':
                return this.service.deleteCheckpoint(args.checkpointId);
            default:
                throw new Error(`Unknown resource tool: ${toolName}`);
        }
    }
    async shutdown() {
        // Cleanup logic if needed
    }
    // ═══════════════════════════════════════════════════════════════
    //                      WRAPPER METHODS
    // ═══════════════════════════════════════════════════════════════
    getStatus() {
        return this.service.getStatus();
    }
    async createCheckpoint(params) {
        return this.service.createCheckpoint(params);
    }
    updateTokenUsage(used, estimated) {
        return this.service.updateTokenUsage(used, estimated);
    }
    listCheckpoints() {
        return this.service.listCheckpoints();
    }
}
export { ResourceService } from './resource.service.js';
export { getResourceTools } from './resource.tools.js';
export * from './resource.types.js';
//# sourceMappingURL=index.js.map