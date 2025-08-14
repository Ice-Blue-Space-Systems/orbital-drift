import React, { useEffect } from "react";
import { perfMonitor } from "../utils/performanceUtils";

interface PerformanceTestProps {
  children: React.ReactNode;
  testName: string;
}

const PerformanceTest: React.FC<PerformanceTestProps> = ({ children, testName }) => {
  useEffect(() => {
    perfMonitor.startTimer(`component-${testName}`);
    perfMonitor.logMemoryUsage(`${testName}-start`);
    
    return () => {
      perfMonitor.endTimer(`component-${testName}`);
      perfMonitor.logMemoryUsage(`${testName}-end`);
    };
  }, [testName]);

  return <>{children}</>;
};

export default PerformanceTest;
