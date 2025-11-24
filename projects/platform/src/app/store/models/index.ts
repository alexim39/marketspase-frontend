// models/index.ts
export * from './store.model';
export * from './product.model';
export * from './store-promotion.model';
export * from './performance-metric.model';

// Re-export utility functions for convenience
export { PerformanceMetricUtils } from './performance-metric.model';
export { DEFAULT_PERFORMANCE_METRICS, INDUSTRY_BENCHMARKS } from './performance-metric.model';