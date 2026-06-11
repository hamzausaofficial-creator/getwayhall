import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import NotFoundTv from '../components/NotFoundTv';
import './not-found.css';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <NotFoundTv />
      <div className="not-found-page__copy">
        <h1 className="not-found-page__title">Page not found</h1>
        <p className="not-found-page__desc">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="not-found-page__actions">
          <Link to="/" className="not-found-page__btn not-found-page__btn--primary">
            <Home size={18} aria-hidden />
            Back to Home
          </Link>
          <button
            type="button"
            className="not-found-page__btn not-found-page__btn--outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} aria-hidden />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
