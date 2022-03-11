import { useState, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';

import { ReactComponent as ArrowLeftIcon } from 'icons/arrow-left.svg';
import { useOutsideClickHandler } from 'hooks/outside-click-hook';

interface DropdownProps {
  on: boolean;
  playbackRates: number[];
  activePlaybackRate: number;
  onClose: (on: boolean) => void;
  onChangePlaybackRate: (playbackRate: number) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  on,
  playbackRates,
  activePlaybackRate,
  onClose,
  onChangePlaybackRate,
}) => {
  const [isIndex, setIsIndex] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'resolution' | 'speed'>('speed');
  const [dropdownHeight, setDropdownHeight] = useState<'initial' | number>(
    'initial'
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClickHandler(dropdownRef.current, () => onClose(false));

  useEffect(() => {
    if (!on) return;

    const dropdown = dropdownRef.current!;
    const dropdownMenu = dropdown.firstChild as HTMLElement;

    setDropdownHeight(dropdownMenu?.offsetHeight || 'initial');
  }, [on]);

  const selectMenuHandler = useCallback(
    (activeMenu: 'resolution' | 'speed') => {
      setIsIndex(false);
      setActiveMenu(activeMenu);
    },
    []
  );

  const dropdownExitedHandler = useCallback(() => {
    setIsIndex(true);
    setDropdownHeight('initial');
  }, []);

  const calcHeight = useCallback((element) => {
    setDropdownHeight(element.offsetHeight);
  }, []);

  const indexMenu = useMemo(() => {
    return (
      <div className="vp-dropdown__menu">
        <ul className="vp-dropdown__list">
          <li
            className="vp-dropdown__item"
            onClick={() => selectMenuHandler('speed')}
          >
            <span>Speed</span>
            <span>x {activePlaybackRate}</span>
          </li>
        </ul>
      </div>
    );
  }, [activePlaybackRate, selectMenuHandler]);

  const menuList = useMemo(() => {
    const changePlaybackRateHandler = (playbackRate: number) => {
      onChangePlaybackRate(playbackRate);
      setIsIndex(true);
    };

    switch (activeMenu) {
      case 'speed':
        return (
          <div className="vp-dropdown__menu">
            <div
              className="vp-dropdown__label"
              onClick={() => setIsIndex(true)}
            >
              <ArrowLeftIcon />
              <span>Speed</span>
            </div>
            <ul className="vp-dropdown__list">
              {playbackRates.map((playbackRate) => (
                <li
                  key={playbackRate}
                  className={`vp-dropdown__item${
                    activePlaybackRate === playbackRate ? ' active' : ''
                  }`}
                  onClick={() => changePlaybackRateHandler(playbackRate)}
                >
                  {playbackRate}
                </li>
              ))}
            </ul>
          </div>
        );
    }
  }, [activeMenu, playbackRates, activePlaybackRate, onChangePlaybackRate]);

  return (
    <CSSTransition
      in={on}
      classNames="vp-dropdown"
      timeout={200}
      mountOnEnter
      unmountOnExit
      onExited={dropdownExitedHandler}
    >
      <div
        className="vp-dropdown"
        ref={dropdownRef}
        style={{ height: dropdownHeight }}
      >
        <CSSTransition
          in={isIndex}
          classNames="menu-index"
          timeout={300}
          mountOnEnter
          unmountOnExit
          onEnter={calcHeight}
        >
          {indexMenu}
        </CSSTransition>

        <CSSTransition
          in={!isIndex}
          classNames="menu-main"
          timeout={300}
          mountOnEnter
          unmountOnExit
          onEnter={calcHeight}
        >
          {menuList}
        </CSSTransition>
      </div>
    </CSSTransition>
  );
};

export default memo(Dropdown);
