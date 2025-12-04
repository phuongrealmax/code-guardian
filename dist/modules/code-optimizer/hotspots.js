// src/modules/code-optimizer/hotspots.ts
// ═══════════════════════════════════════════════════════════════
//                      HOTSPOT DETECTION
// ═══════════════════════════════════════════════════════════════
export function selectHotspots(input) {
    const { metrics, maxResults = 20, strategy = 'mixed', thresholds = {}, } = input;
    // Default thresholds
    const minLines = thresholds.minLines ?? 50;
    const minComplexity = thresholds.minComplexity ?? 20;
    const minNesting = thresholds.minNesting ?? 3;
    // Filter files that meet minimum thresholds
    const candidates = metrics.filter((m) => m.lines >= minLines ||
        (m.complexityScore ?? 0) >= minComplexity ||
        m.maxNestingDepth >= minNesting ||
        m.todoCount > 3 ||
        m.fixmeCount > 0);
    // Score each candidate based on strategy
    const scored = candidates.map((m) => {
        const score = calculateHotspotScore(m, strategy);
        const reasons = identifyReasons(m);
        const suggestedGoal = determineSuggestedGoal(m, reasons);
        return {
            path: m.path,
            score,
            reasons,
            suggestedGoal,
            metrics: {
                lines: m.lines,
                complexity: m.complexityScore ?? m.branchScore,
                nesting: m.maxNestingDepth,
                todos: m.todoCount + m.fixmeCount,
            },
        };
    });
    // Sort by score descending and take top N
    const sorted = scored.sort((a, b) => b.score - a.score);
    const topHotspots = sorted.slice(0, maxResults);
    // Add rank
    const rankedHotspots = topHotspots.map((h, index) => ({
        ...h,
        rank: index + 1,
    }));
    // Determine top reason across all hotspots
    const reasonCounts = new Map();
    for (const h of rankedHotspots) {
        for (const reason of h.reasons) {
            const key = reason.split(':')[0] || reason;
            reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
        }
    }
    const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'Mixed issues';
    return {
        hotspots: rankedHotspots,
        summary: {
            totalAnalyzed: metrics.length,
            hotspotsFound: rankedHotspots.length,
            strategy,
            topReason,
        },
    };
}
// ═══════════════════════════════════════════════════════════════
//                      SCORING
// ═══════════════════════════════════════════════════════════════
function calculateHotspotScore(m, strategy) {
    const complexity = m.complexityScore ?? m.branchScore;
    switch (strategy) {
        case 'size':
            // Prioritize large files
            return normalizeScore(m.lines, 100, 1000) * 100;
        case 'complexity':
            // Prioritize complex files
            return (normalizeScore(complexity, 10, 80) * 50 +
                normalizeScore(m.maxNestingDepth, 2, 8) * 30 +
                normalizeScore(m.branchScore, 5, 50) * 20);
        case 'mixed':
        default:
            // Balanced scoring
            const sizeScore = normalizeScore(m.lines, 100, 800) * 25;
            const complexityScore = normalizeScore(complexity, 10, 60) * 30;
            const nestingScore = normalizeScore(m.maxNestingDepth, 2, 6) * 20;
            const branchingScore = normalizeScore(m.branchScore, 5, 40) * 15;
            const debtScore = normalizeScore(m.todoCount + m.fixmeCount * 2, 1, 10) * 10;
            return sizeScore + complexityScore + nestingScore + branchingScore + debtScore;
    }
}
function normalizeScore(value, min, max) {
    if (value <= min)
        return 0;
    if (value >= max)
        return 1;
    return (value - min) / (max - min);
}
// ═══════════════════════════════════════════════════════════════
//                      REASON IDENTIFICATION
// ═══════════════════════════════════════════════════════════════
function identifyReasons(m) {
    const reasons = [];
    const complexity = m.complexityScore ?? m.branchScore;
    // Size reasons
    if (m.lines > 800) {
        reasons.push(`Very large file: ${m.lines} lines`);
    }
    else if (m.lines > 400) {
        reasons.push(`Large file: ${m.lines} lines`);
    }
    // Complexity reasons
    if (complexity > 60) {
        reasons.push(`Very high complexity: ${Math.round(complexity)}`);
    }
    else if (complexity > 30) {
        reasons.push(`High complexity: ${Math.round(complexity)}`);
    }
    // Nesting reasons
    if (m.maxNestingDepth > 6) {
        reasons.push(`Very deep nesting: level ${m.maxNestingDepth}`);
    }
    else if (m.maxNestingDepth > 4) {
        reasons.push(`Deep nesting: level ${m.maxNestingDepth}`);
    }
    // Branching reasons
    if (m.branchScore > 40) {
        reasons.push(`Many branches: score ${Math.round(m.branchScore)}`);
    }
    else if (m.branchScore > 20) {
        reasons.push(`Complex branching: score ${Math.round(m.branchScore)}`);
    }
    // Technical debt reasons
    if (m.fixmeCount > 0) {
        reasons.push(`Has ${m.fixmeCount} FIXME${m.fixmeCount > 1 ? 's' : ''}`);
    }
    if (m.todoCount > 5) {
        reasons.push(`Many TODOs: ${m.todoCount}`);
    }
    else if (m.todoCount > 0) {
        reasons.push(`Has ${m.todoCount} TODO${m.todoCount > 1 ? 's' : ''}`);
    }
    // If no specific reasons, add a generic one
    if (reasons.length === 0) {
        reasons.push('Moderate complexity');
    }
    return reasons;
}
// ═══════════════════════════════════════════════════════════════
//                      GOAL SUGGESTION
// ═══════════════════════════════════════════════════════════════
function determineSuggestedGoal(m, reasons) {
    const complexity = m.complexityScore ?? m.branchScore;
    const reasonText = reasons.join(' ').toLowerCase();
    // Check for specific patterns
    if (m.lines > 600 && m.maxNestingDepth > 4) {
        return 'split-module';
    }
    if (reasonText.includes('fixme') || m.fixmeCount > 2) {
        return 'refactor';
    }
    if (m.maxNestingDepth > 5 || m.branchScore > 35) {
        return 'simplify';
    }
    if (m.todoCount > 5) {
        return 'document';
    }
    if (complexity > 40 || m.lines > 400) {
        return 'refactor';
    }
    // Check if file might need tests
    const path = m.path.toLowerCase();
    if (!path.includes('test') &&
        !path.includes('spec') &&
        complexity > 20) {
        return 'add-tests';
    }
    return 'refactor';
}
// ═══════════════════════════════════════════════════════════════
//                      UTILITIES
// ═══════════════════════════════════════════════════════════════
/**
 * Group hotspots by suggested goal
 */
export function groupHotspotsByGoal(hotspots) {
    const groups = {
        refactor: [],
        'add-tests': [],
        'split-module': [],
        simplify: [],
        document: [],
    };
    for (const hotspot of hotspots) {
        groups[hotspot.suggestedGoal].push(hotspot);
    }
    return groups;
}
/**
 * Get priority order for addressing hotspots
 */
export function getPriorityOrder(hotspots) {
    // Sort by score and return paths
    return [...hotspots]
        .sort((a, b) => b.score - a.score)
        .map((h) => h.path);
}
/**
 * Filter hotspots by minimum score
 */
export function filterByScore(hotspots, minScore) {
    return hotspots.filter((h) => h.score >= minScore);
}
//# sourceMappingURL=hotspots.js.map