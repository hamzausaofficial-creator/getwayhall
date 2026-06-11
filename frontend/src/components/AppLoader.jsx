import { cn } from '../lib/utils';
import AppLogo from './AppLogo';
import './app-loader.css';

function SpeederLoader() {
  return (
    <>
      <div className="al-longfazers" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="al-loader" aria-hidden>
        <span>
          <span />
          <span />
          <span />
          <span />
        </span>
        <div className="al-base">
          <span />
          <div className="al-face" />
        </div>
      </div>
    </>
  );
}

export default function AppLoader({
  fullScreen = false,
  inline = false,
  message,
  className,
  label = 'Loading',
}) {
  return (
    <div
      className={cn(
        'app-loader',
        fullScreen && 'app-loader--fullscreen',
        inline && 'app-loader--inline',
        !fullScreen && !inline && 'app-loader--page',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={message || label}
    >
      {!inline && (
        <AppLogo size={fullScreen ? 'md' : 'sm'} tone="dark" className="app-loader__brand" />
      )}
      <div className="app-loader__stage">
        <SpeederLoader />
      </div>
      {message ? <p className="app-loader__message">{message}</p> : null}
    </div>
  );
}
