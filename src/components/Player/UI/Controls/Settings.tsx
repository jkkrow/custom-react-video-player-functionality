import { memo } from 'react';

import Btn from './Btn';
import { ReactComponent as SettingIcon } from 'icons/gear.svg';

interface SettingsProps {
  onToggle: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onToggle }) => {
  return (
    <Btn label="Settings" onClick={onToggle}>
      <SettingIcon />
    </Btn>
  );
};

export default memo(Settings);
