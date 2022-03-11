import { memo } from 'react';

import Btn from './Btn';
import { ReactComponent as TrackSkipIcon } from 'icons/track-skip.svg';

interface SkipProps {
  onSkip: () => void;
}

const Skip: React.FC<SkipProps> = ({ onSkip }) => {
  return (
    <Btn label="+ 10 seconds" onClick={onSkip}>
      <TrackSkipIcon />
    </Btn>
  );
};

export default memo(Skip);
