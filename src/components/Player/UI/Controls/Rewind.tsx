import { memo } from 'react';

import Btn from './Btn';
import { ReactComponent as TrackRewindIcon } from 'icons/track-rewind.svg';

interface RewindProps {
  onRewind: () => void;
}

const Rewind: React.FC<RewindProps> = ({ onRewind }) => {
  return (
    <Btn label="- 10 seconds" onClick={onRewind}>
      <TrackRewindIcon />
    </Btn>
  );
};

export default memo(Rewind);
