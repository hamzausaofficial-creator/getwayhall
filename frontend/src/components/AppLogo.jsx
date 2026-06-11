import { cn } from '../lib/utils';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../constants/brand';
import './app-logo.css';

const SIZES = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 52,
};

export default function AppLogo({
  size = 'md',
  tone = 'dark',
  showName = false,
  showImage = true,
  subtitle,
  name = BRAND_NAME,
  nameAccent,
  className,
  imageClassName,
  nameClassName,
  accentClassName,
  subtitleClassName,
  alt = 'Gateway logo',
}) {
  const px = SIZES[size] || SIZES.md;

  return (
    <div className={cn('app-logo', className)}>
      {showImage && (
        <img
          src={BRAND_LOGO_SRC}
          alt={alt}
          width={px}
          height={px}
          style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
          className={cn('app-logo__img', `app-logo__img--${tone}`, imageClassName)}
          draggable={false}
        />
      )}
      {showName && (
        <div className="app-logo__text">
          <span className={cn('app-logo__name', nameClassName)}>
            {name}
            {nameAccent ? (
              <>
                {' '}
                <span className={cn('app-logo__name-accent', accentClassName)}>{nameAccent}</span>
              </>
            ) : null}
          </span>
          {subtitle ? (
            <span className={cn('app-logo__subtitle', subtitleClassName)}>{subtitle}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
