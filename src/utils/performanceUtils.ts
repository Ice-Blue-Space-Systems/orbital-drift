import React from "react";

// Performance monitoring utilities for debugging route change issues

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.marks.set(label, performance.now());
    console.log(`🚀 Performance: Started ${label}`);
  }

  endTimer(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`⚠️ Performance: No start time found for ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    if (duration > 100) {
      console.warn(`🐌 Performance: ${label} took ${duration.toFixed(2)}ms (>100ms)`);
    } else {
      console.log(`✅ Performance: ${label} completed in ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  measureAsync<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return asyncFn().finally(() => {
      this.endTimer(label);
    });
  }

  measureSync<T>(label: string, syncFn: () => T): T {
    this.startTimer(label);
    try {
      return syncFn();
    } finally {
      this.endTimer(label);
    }
  }

  logMemoryUsage(label: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`🧠 Memory (${label}):`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`
      });
    }
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();

// HOC for measuring component render times
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceWrappedComponent(props: P) {
    React.useEffect(() => {
      perfMonitor.startTimer(`${componentName}-mount`);
      return () => {
        perfMonitor.endTimer(`${componentName}-unmount`);
      };
    }, []);

    React.useLayoutEffect(() => {
      perfMonitor.endTimer(`${componentName}-mount`);
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for measuring route transitions
export function useRoutePerformance(routeName: string) {
  React.useEffect(() => {
    perfMonitor.startTimer(`route-${routeName}`);
    perfMonitor.logMemoryUsage(`route-${routeName}-start`);
    
    return () => {
      perfMonitor.endTimer(`route-${routeName}`);
      perfMonitor.logMemoryUsage(`route-${routeName}-end`);
    };
  }, [routeName]);
}
