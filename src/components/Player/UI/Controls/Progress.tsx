import { memo, forwardRef } from 'react';

interface ProgressProps {
  videoDuration: number;
  bufferProgress: number;
  currentProgress: number;
  seekProgress: number;
  seekTooltipPosition: string;
  seekTooltip: string;
  onHover: (event: React.MouseEvent) => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      bufferProgress,
      currentProgress,
      videoDuration,
      seekProgress,
      seekTooltipPosition,
      seekTooltip,
      onHover,
      onSeek,
    },
    ref
  ) => {
    const preventDefault = (e: React.KeyboardEvent) => {
      e.preventDefault();
    };

    return (
      <div className="vp-progress" ref={ref}>
        <div className="vp-progress__range">
          <div className="vp-progress__range--background" />
          <div
            className="vp-progress__range--buffer"
            style={{ width: bufferProgress + '%' }}
          />
          <div
            className="vp-progress__range--current"
            style={{ width: currentProgress + '%' }}
          >
            <div className="vp-progress__range--current__thumb" />
          </div>
          <input
            className="vp-progress__range--seek"
            type="range"
            step="any"
            max={videoDuration}
            value={seekProgress}
            onMouseMove={onHover}
            onChange={onSeek}
            onKeyDown={preventDefault}
          />
        </div>

        <span
          className="vp-progress__tooltip"
          style={{ left: seekTooltipPosition }}
        >
          {seekTooltip}
        </span>
      </div>
    );
  }
);

export default memo(Progress);
