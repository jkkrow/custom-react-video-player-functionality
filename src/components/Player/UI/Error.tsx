import { memo } from 'react';

import { ReactComponent as ReloadIcon } from 'icons/reload.svg';

const Error: React.FC = () => {
  const refreshHandler = () => {
    window.location.reload();
  };

  return (
    <div className="vp-error">
      <p>Error occurred! Please try again</p>
      <ReloadIcon className="btn" onClick={refreshHandler} />
    </div>
  );
};

export default memo(Error);
