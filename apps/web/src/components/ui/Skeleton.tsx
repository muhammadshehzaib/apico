import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '20px',
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .skeleton-shimmer {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            #12141a 0%,
            #1e2430 50%,
            #12141a 100%
          );
          background-size: 1000px 100%;
          background-color: #12141a;
        }
      `}</style>
      <div
        className={`skeleton-shimmer rounded ${className}`}
        style={{
          width: widthStyle,
          height: heightStyle,
        }}
      />
    </>
  );
};

Skeleton.displayName = 'Skeleton';
