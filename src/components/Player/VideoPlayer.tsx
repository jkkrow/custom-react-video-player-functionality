import { useState, useCallback, useEffect, useRef } from 'react';

import Playback from './Controls/Playback';
import Skip from './Controls/Skip';
import Rewind from './Controls/Rewind';
import Volume from './Controls/Volume';
import Progress from './Controls/Progress';
import Time from './Controls/Time';
import Pip from './Controls/Pip';
import Fullscreen from './Controls/Fullscreen';
import Settings from './Controls/Settings';
import Dropdown from './Controls/Dropdown';
import Loader from './UI/Loader/Loader';
import KeyAction, { KeyActionHandle } from './UI/KeyAction/KeyAction';
import Error from './UI/Error/Error';
import { useTimeout } from '../../hooks/timer-hook';
import { useLocalStorage } from '../../hooks/storage-hook';
import { formatTime } from '../../util/format';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, autoPlay = true }) => {
  const [displayControls, setDisplayControls] = useState(true);
  const [playbackState, setPlaybackState] = useState(false);
  const [volumeState, setVolumeState] = useLocalStorage('video-volume', 1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [seekProgress, setSeekProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [seekTooltip, setSeekTooltip] = useState('00:00');
  const [seekTooltipPosition, setSeekTooltipPosition] = useState('');
  const [currentTimeUI, setCurrentTimeUI] = useState('00:00');
  const [remainedTimeUI, setRemainedTimeUI] = useState('00:00');
  const [pipState, setPipState] = useState(false);
  const [fullscreenState, setFullscreenState] = useState(false);
  const [displayDropdown, setDisplayDropdown] = useState(false);
  const [playbackRates] = useState([0.5, 0.75, 1, 1.25, 1.5]);
  const [activePlaybackRate, setActivePlaybackRate] = useLocalStorage(
    'video-playbackrate',
    1
  );
  const [displayLoader, setDisplayLoader] = useState(true);
  const [volumeKeyAction, setvolumeKeyAction] = useState(false);
  const [videoError, setVideoError] = useState<MediaError | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoKeyActionRef = useRef<KeyActionHandle>(null);

  const playPromise = useRef<Promise<void>>();
  const volumeData = useRef(volumeState || 1);
  const progressSeekData = useRef(0);

  const [setControlsTimeout] = useTimeout();
  const [setKeyActionVolumeTimeout] = useTimeout();
  const [setLoaderTimeout, clearLoaderTimeout] = useTimeout();

  /**
   * TOGGLE SHOWING CONTROLS
   */

  const hideControlsHandler = useCallback(() => {
    const video = videoRef.current!;

    if (video.paused) {
      return;
    }

    setDisplayControls(false);
  }, []);

  const showControlsHandler = useCallback(() => {
    const video = videoRef.current!;

    setDisplayControls(true);

    if (video.paused) {
      return;
    }

    setControlsTimeout(() => {
      hideControlsHandler();
    }, 2000);
  }, [hideControlsHandler, setControlsTimeout]);

  /**
   * PLAYBACK
   */

  const togglePlayHandler = useCallback(() => {
    const video = videoRef.current!;

    if (video.paused || video.ended) {
      playPromise.current = video.play();
      return;
    }

    if (!playPromise.current) {
      return;
    }

    playPromise.current.then(() => {
      video.pause();
    });
  }, []);

  const videoPlayHandler = useCallback(() => {
    setPlaybackState(true);
    showControlsHandler();
  }, [showControlsHandler]);

  const videoPauseHandler = useCallback(() => {
    setPlaybackState(false);
    showControlsHandler();
  }, [showControlsHandler]);

  /**
   * LOADING
   */

  const showLoaderHandler = useCallback(() => {
    setLoaderTimeout(() => setDisplayLoader(true), 300);
  }, [setLoaderTimeout]);

  const hideLoaderHandler = useCallback(() => {
    clearLoaderTimeout();
    setDisplayLoader(false);
  }, [clearLoaderTimeout]);

  /**
   * VOLUME
   */

  const volumeInputHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current!;

      video.volume = +event.target.value;
    },
    []
  );

  const volumeChangeHandler = useCallback(() => {
    const video = videoRef.current!;

    setVolumeState(video.volume);

    if (video.volume === 0) {
      video.muted = true;
    } else {
      video.muted = false;
      volumeData.current = video.volume;
    }
  }, [setVolumeState]);

  const toggleMuteHandler = useCallback(() => {
    const video = videoRef.current!;

    if (video.volume !== 0) {
      volumeData.current = video.volume;
      video.volume = 0;
      setVolumeState(0);
    } else {
      video.volume = volumeData.current;
      setVolumeState(volumeData.current);
    }
  }, [setVolumeState]);

  /**
   * TIME
   */

  const timeChangeHandler = useCallback(() => {
    const video = videoRef.current!;

    const duration = video.duration || 0;
    const currentTime = video.currentTime || 0;
    const buffer = video.buffered;

    // Progress
    setCurrentProgress((currentTime / duration) * 100);
    setSeekProgress(currentTime);

    if (duration > 0) {
      for (let i = 0; i < buffer.length; i++) {
        if (
          buffer.start(buffer.length - 1 - i) === 0 ||
          buffer.start(buffer.length - 1 - i) < video.currentTime
        ) {
          setBufferProgress(
            (buffer.end(buffer.length - 1 - i) / duration) * 100
          );
          break;
        }
      }
    }

    // Time
    const formattedCurrentTime = formatTime(Math.round(currentTime));
    const formattedRemainedTime = formatTime(
      Math.round(duration) - Math.round(currentTime)
    );

    setCurrentTimeUI(formattedCurrentTime);
    setRemainedTimeUI(formattedRemainedTime);
  }, []);

  /**
   * SEEK
   */

  const seekMouseMoveHandler = useCallback((event: React.MouseEvent) => {
    const video = videoRef.current!;

    const rect = event.currentTarget.getBoundingClientRect();
    const skipTo = (event.nativeEvent.offsetX / rect.width) * video.duration;

    progressSeekData.current = skipTo;

    let formattedTime: string;

    if (skipTo > video.duration) {
      formattedTime = formatTime(video.duration);
    } else if (skipTo < 0) {
      formattedTime = '00:00';
    } else {
      formattedTime = formatTime(skipTo);
      setSeekTooltipPosition(`${event.nativeEvent.offsetX}px`);
    }

    setSeekTooltip(formattedTime);
  }, []);

  const seekInputHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current!;

      const skipTo = progressSeekData.current || +event.target.value;

      video.currentTime = skipTo;
      setCurrentProgress((skipTo / video.duration) * 100);
      setSeekProgress(skipTo);
    },
    []
  );

  /**
   * REWIND & SKIP
   */

  const rewindHandler = useCallback(() => {
    const video = videoRef.current!;

    video.currentTime -= 10;

    const rewindContainer = videoKeyActionRef.current!.rewind;
    const rewindElement = rewindContainer.firstElementChild as HTMLElement;

    rewindContainer.animate(
      [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
      {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards',
      }
    );
    rewindElement.animate(
      [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(-20%)` },
      ],
      {
        duration: 1000,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );
  }, []);

  const skipHandler = useCallback(() => {
    const video = videoRef.current!;

    video.currentTime += 10;

    const forwardContainer = videoKeyActionRef.current!.skip;
    const forwardElement = forwardContainer.firstElementChild as HTMLElement;

    forwardContainer.animate(
      [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
      {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards',
      }
    );
    forwardElement.animate(
      [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(20%)` },
      ],
      {
        duration: 1000,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );
  }, []);

  /**
   * PIP
   */

  const togglePipHandler = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      videoRef.current!.requestPictureInPicture();
    }
  }, []);

  const pipEnterHandler = useCallback(() => {
    setPipState(true);
  }, []);

  const pipExitHandler = useCallback(() => {
    setPipState(false);
  }, []);

  /**
   * FULLSCREEN
   */

  const toggleFullscreenHandler = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current!.requestFullscreen();
    }
  }, []);

  const fullscreenChangeHandler = useCallback(() => {
    if (document.fullscreenElement) {
      setFullscreenState(true);
    } else {
      setFullscreenState(false);
    }
  }, []);

  /**
   * DROPDOWN
   */

  const toggleDropdownHandler = useCallback(() => {
    setDisplayDropdown((prev) => !prev);
  }, []);

  /**
   * SETTINGS
   */

  const changePlaybackRateHandler = useCallback(
    (playbackRate: number) => {
      const video = videoRef.current!;

      video.playbackRate = playbackRate;
      setActivePlaybackRate(playbackRate);
    },
    [setActivePlaybackRate]
  );

  /**
   * KEYBOARD SHORTKUTS
   */

  const keyEventHandler = useCallback(
    (event: KeyboardEvent) => {
      const video = videoRef.current!;
      const activeElement = document.activeElement;

      if (
        !activeElement ||
        (activeElement.localName === 'input' &&
          (activeElement as HTMLInputElement).type !== 'range') ||
        activeElement.localName === 'textarea'
      ) {
        return;
      }

      const { key } = event;

      switch (key) {
        case 'ArrowLeft':
          event.preventDefault();
          rewindHandler();
          break;
        case 'ArrowRight':
          event.preventDefault();
          skipHandler();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (video.volume + 0.05 > 1) {
            video.volume = 1;
          } else {
            video.volume = +(video.volume + 0.05).toFixed(2);
          }

          setvolumeKeyAction(true);
          setKeyActionVolumeTimeout(() => {
            setvolumeKeyAction(false);
          }, 1500);

          break;
        case 'ArrowDown':
          event.preventDefault();
          if (video.volume - 0.05 < 0) {
            video.volume = 0;
          } else {
            video.volume = +(video.volume - 0.05).toFixed(2);
          }

          setvolumeKeyAction(true);
          setKeyActionVolumeTimeout(() => {
            setvolumeKeyAction(false);
          }, 1500);

          break;
        case ' ':
          event.preventDefault();
          togglePlayHandler();
          break;
      }
    },
    [togglePlayHandler, rewindHandler, skipHandler, setKeyActionVolumeTimeout]
  );

  /**
   * LOAD VIDEO
   */

  const videoLoadedHandler = useCallback(() => {
    const video = videoRef.current!;

    video.volume = volumeState;
    video.playbackRate = activePlaybackRate;

    setVideoDuration(video.duration);
    timeChangeHandler();

    video.addEventListener('enterpictureinpicture', pipEnterHandler);
    video.addEventListener('leavepictureinpicture', pipExitHandler);
    document.addEventListener('keydown', keyEventHandler);
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);

    autoPlay && (playPromise.current = video.play());
  }, [
    autoPlay,
    volumeState,
    activePlaybackRate,
    timeChangeHandler,
    pipEnterHandler,
    pipExitHandler,
    keyEventHandler,
    fullscreenChangeHandler,
  ]);

  /**
   * ERROR HANDLER
   */

  const errorHandler = useCallback(() => {
    const video = videoRef.current!;

    video.error && setVideoError(video.error);
  }, []);

  /**
   * INITIATE PLAYER
   */

  useEffect(() => {
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      document.removeEventListener('keydown', keyEventHandler);
    };
  }, [fullscreenChangeHandler, keyEventHandler]);

  /**
   * RENDER
   */

  return (
    <div
      className="vp-container"
      ref={videoContainerRef}
      style={{ cursor: displayControls ? 'default' : 'none' }}
      onMouseMove={showControlsHandler}
      onMouseLeave={hideControlsHandler}
    >
      <video
        ref={videoRef}
        src={src}
        controls={false}
        onLoadedMetadata={videoLoadedHandler}
        onClick={togglePlayHandler}
        onPlay={videoPlayHandler}
        onPause={videoPauseHandler}
        onVolumeChange={volumeChangeHandler}
        onTimeUpdate={timeChangeHandler}
        onDoubleClick={toggleFullscreenHandler}
        onSeeking={showLoaderHandler}
        onSeeked={hideLoaderHandler}
        onWaiting={showLoaderHandler}
        onCanPlay={hideLoaderHandler}
        onError={errorHandler}
      />
      <Loader on={displayLoader} />
      <KeyAction
        ref={videoKeyActionRef}
        on={volumeKeyAction}
        volume={volumeState}
      />
      <Error error={videoError} />
      <div className={`vp-controls${!displayControls ? ' hide' : ''}`}>
        <Dropdown
          on={displayDropdown}
          playbackRates={playbackRates}
          activePlaybackRate={activePlaybackRate}
          onClose={setDisplayDropdown}
          onChangePlaybackRate={changePlaybackRateHandler}
        />
        <div className="vp-controls__header">
          <Time time={currentTimeUI} />
          <Progress
            bufferProgress={bufferProgress}
            currentProgress={currentProgress}
            videoDuration={videoDuration}
            seekProgress={seekProgress}
            seekTooltip={seekTooltip}
            seekTooltipPosition={seekTooltipPosition}
            onHover={seekMouseMoveHandler}
            onSeek={seekInputHandler}
          />
          <Time time={remainedTimeUI} />
        </div>
        <div className="vp-controls__body">
          <div>
            <Volume
              volume={volumeState}
              onToggle={toggleMuteHandler}
              onSeek={volumeInputHandler}
            />
          </div>
          <div>
            <Rewind onRewind={rewindHandler} />
            <Playback isPlaying={playbackState} onToggle={togglePlayHandler} />
            <Skip onSkip={skipHandler} />
          </div>
          <div>
            <Settings onToggle={toggleDropdownHandler} />
            <Pip isPipMode={pipState} onToggle={togglePipHandler} />
            <Fullscreen
              isFullscreen={fullscreenState}
              onToggle={toggleFullscreenHandler}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
