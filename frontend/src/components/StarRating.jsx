import { useState } from 'react';
import PropTypes from 'prop-types';

const StarRating = ({ rating, onRatingChange, interactive = false, size = 'text-lg' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${size} ${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={!interactive}
        >
          <span className={`${displayRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number,
  onRatingChange: PropTypes.func,
  interactive: PropTypes.bool,
  size: PropTypes.string
};

export default StarRating;
