/**
 * Hotspot Detector
 *
 * Identifies code hotspots that should be prioritized for
 * refactoring based on metrics and configurable thresholds.
 */
import { HotspotsInput, HotspotsOutput, Hotspot, SuggestedGoal } from './types.js';
export declare function selectHotspots(input: HotspotsInput): HotspotsOutput;
/**
 * Group hotspots by suggested goal
 */
export declare function groupHotspotsByGoal(hotspots: Hotspot[]): Record<SuggestedGoal, Hotspot[]>;
/**
 * Get priority order for addressing hotspots
 */
export declare function getPriorityOrder(hotspots: Hotspot[]): string[];
/**
 * Filter hotspots by minimum score
 */
export declare function filterByScore(hotspots: Hotspot[], minScore: number): Hotspot[];
//# sourceMappingURL=hotspots.d.ts.map