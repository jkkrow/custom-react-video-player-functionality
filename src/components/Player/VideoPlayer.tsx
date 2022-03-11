import { useState, useCallback, useEffect, useRef } from 'react';

import Playback from './UI/Controls/Playback';
import Skip from './UI/Controls/Skip';
import Rewind from './UI/Controls/Rewind';
import Volume from './UI/Controls/Volume';
import Progress from './UI/Controls/Progress';
import Time from './UI/Controls/Time';
import Pip from './UI/Controls/Pip';
import Fullscreen from './UI/Controls/Fullscreen';
import Settings from './UI/Controls/Settings';
import Dropdown from './UI/Controls/Dropdown';
import Loader from './UI/Loader';
import KeyAction, { KeyActionHandler } from './UI/KeyAction';
import Error from './UI/Error';
import { useTimeout } from '../../hooks/timer-hook';
import { useLocalStorage } from '../../hooks/storage-hook';
import { formatTime } from '../../util/format';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, autoPlay = true }) => {
  // vp-container
  const [displayCursor, setDisplayCursor] = useState<'default' | 'none'>(
    'default'
  );

  // vp-controls
  const [displayControls, setDisplayControls] = useState(true);

  // playback
  const [isPlaying, setIsPlaying] = useState(false);

  // volume
  const [volumeState, setVolumeState] = useLocalStorage('video-volume', 1);

  // progress
  const [currentProgress, setCurrentProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [seekProgress, setSeekProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // seek tooltip
  const [seekTooltip, setSeekTooltip] = useState('00:00');
  const [seekTooltipPosition, setSeekTooltipPosition] = useState('');

  // time ui
  const [currentTimeUI, setCurrentTimeUI] = useState('00:00');
  const [remainedTimeUI, setRemainedTimeUI] = useState('00:00');

  // pip
  const [pipState, setPipState] = useState(false);

  // fullscreen
  const [fullscreenState, setFullscreenState] = useState(false);

  // dropdown
  const [displayDropdown, setDisplayDropdown] = useState(false);

  // playbackRate
  const [playbackRates] = useState([0.5, 0.75, 1, 1.25, 1.5]);
  const [activePlaybackRate, setActivePlaybackRate] = useLocalStorage(
    'video-playbackrate',
    1
  );

  // vp-loader
  const [displayLoader, setDisplayLoader] = useState(true);

  // vp-key-action
  const [volumeKeyAction, setvolumeKeyAction] = useState(false);

  // error
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoProgressRef = useRef<HTMLDivElement>(null);
  const videoKeyActionRef = useRef<KeyActionHandler>(null);

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

    setDisplayCursor('default');
    setDisplayControls(true);

    if (video.paused) {
      return;
    }

    setControlsTimeout(() => {
      hideControlsHandler();
      !video.paused && setDisplayCursor('none');
    }, 2000);
  }, [hideControlsHandler, setControlsTimeout]);

  /**
   * PLAYBACK CONTROL
   */

  const togglePlayHandler = useCallback(() => {
    const video = videoRef.current!;

    if (video.paused || video.ended) {
      playPromise.current = video.play();
      showControlsHandler();
      return;
    }

    if (playPromise.current === undefined) {
      return;
    }

    playPromise.current.then(() => {
      video.pause();
      showControlsHandler();
    });
  }, [showControlsHandler]);

  const videoPlayHandler = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const videoPauseHandler = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * LOADING CONTROL
   */

  const showLoaderHandler = useCallback(() => {
    setLoaderTimeout(() => setDisplayLoader(true), 300);
  }, [setLoaderTimeout]);

  const hideLoaderHandler = useCallback(() => {
    clearLoaderTimeout();
    setDisplayLoader(false);
  }, [clearLoaderTimeout]);

  /**
   * VOLUME CONTROL
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
   * TIME CONTROL
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
    setCurrentTimeUI(formatTime(Math.round(currentTime)));
    setRemainedTimeUI(
      formatTime(Math.round(duration) - Math.round(currentTime))
    );
  }, []);

  /**
   * SKIP CONTROL
   */

  const seekMouseMoveHandler = useCallback((event: React.MouseEvent) => {
    const video = videoRef.current!;
    const progress = videoProgressRef.current!;

    const rect = progress.getBoundingClientRect();
    const skipTo =
      (event.nativeEvent.offsetX / progress.offsetWidth) * video.duration;
    let newTime: string;

    if (skipTo > video.duration) {
      newTime = formatTime(video.duration);
    } else if (skipTo < 0) {
      newTime = '00:00';
    } else {
      newTime = formatTime(skipTo);
      setSeekTooltipPosition(`${event.pageX - rect.left}px`);
    }

    progressSeekData.current = skipTo;
    setSeekTooltip(newTime);
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
   * Rewind & Skip
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
   * PIP CONTROL
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
   * FULLSCREEN CONTROL
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

  const videoLoadHandler = useCallback(() => {
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
    setVideoError(true);
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

  return videoError ? (
    <Error />
  ) : (
    <div
      className="vp-container"
      ref={videoContainerRef}
      style={{ cursor: displayCursor }}
      onMouseMove={showControlsHandler}
      onMouseLeave={hideControlsHandler}
    >
      <video
        ref={videoRef}
        src={src}
        controls={false}
        onLoadedMetadata={videoLoadHandler}
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
      <div
        className={`vp-controls${!displayControls ? ' hide' : ''}`}
        onMouseDown={showControlsHandler}
      >
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
            ref={videoProgressRef}
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
            <Playback isPlaying={isPlaying} onToggle={togglePlayHandler} />
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
