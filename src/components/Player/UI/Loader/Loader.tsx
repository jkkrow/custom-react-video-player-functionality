import { memo } from 'react';
import { CSSTransition } from 'react-transition-group';

import './Loader.css';

interface LoaderProps {
  on: boolean;
  style?: React.CSSProperties;
}

const Loader: React.FC<LoaderProps> = ({ on, style }) => (
  <CSSTransition
    in={on}
    classNames="vp-loader"
    timeout={300}
    mountOnEnter
    unmountOnExit
  >
    <div className="vp-loader" style={style}>
      <div />
    </div>
  </CSSTransition>
);

export default memo(Loader);
