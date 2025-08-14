import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectCesiumClockUtc } from '../store/selectors/cesiumClockSelectors';
import './UtcTimeWidget.css';

interface UtcTimeWidgetProps {
  position?: 'top-center' | 'top-left' | 'top-right' | 'bottom-center';
}

const UtcTimeWidget: React.FC<UtcTimeWidgetProps> = ({ position = 'top-center' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Get UTC time and multiplier from Redux
  const utc = useSelector(selectCesiumClockUtc);
  const cesiumMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);

  // Format the UTC time
  const formatUtcTime = (utcString: string) => {
    try {
      const date = new Date(utcString);
      const timeString = date.toISOString().slice(11, 19); // HH:MM:SS
      const dateString = date.toISOString().slice(0, 10); // YYYY-MM-DD
      return { date: dateString, time: timeString };
    } catch {
      return { date: 'Invalid', time: 'Date' };
    }
  };

  const { date, time } = formatUtcTime(utc);

  // Initialize position based on prop
  useEffect(() => {
    if (!widgetRef.current) return;

    const widget = widgetRef.current;
    const rect = widget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let initialX = 0;
    let initialY = 20;

    switch (position) {
      case 'top-center':
        initialX = (viewportWidth - rect.width) / 2;
        initialY = 20;
        break;
      case 'top-left':
        initialX = 20;
        initialY = 20;
        break;
      case 'top-right':
        initialX = viewportWidth - rect.width - 20;
        initialY = 20;
        break;
      case 'bottom-center':
        initialX = (viewportWidth - rect.width) / 2;
        initialY = viewportHeight - rect.height - 20;
        break;
    }

    setWidgetPosition({ x: initialX, y: initialY });
  }, [position]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport bounds
      newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
      newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));

      setWidgetPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={widgetRef}
      className={`utc-time-widget ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${widgetPosition.x}px`,
        top: `${widgetPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="utc-time-content">
        <div className="utc-date">{date}</div>
        <div className="utc-time">{time}</div>
        <div className="utc-zone">UTC</div>
        {cesiumMultiplier !== 1 && (
          <div className="speed-multiplier">{cesiumMultiplier}x</div>
        )}
      </div>
    </div>
  );
};

export default UtcTimeWidget;
