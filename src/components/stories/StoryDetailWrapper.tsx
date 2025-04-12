
import React, { useRef } from 'react';
import StoryDetail from './StoryDetail';

const StoryDetailWrapper: React.FC = () => {
  const detailRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Original StoryDetail component wrapped in a div with ref */}
      <div ref={detailRef}>
        <StoryDetail />
      </div>
    </div>
  );
};

export default StoryDetailWrapper;
