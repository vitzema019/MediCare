import React, { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
  maxRating?: number;
  defaultRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  maxRating = 5,
  defaultRating = 0,
  onRatingChange,
  size = 'medium',
  readonly = false,
  className = ''
}) => {
  const [rating, setRating] = useState(defaultRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue: number) => {
    if (readonly) return;
    
    setRating(starValue);
    onRatingChange?.(starValue);
  };

  const handleStarHover = (starValue: number) => {
    if (readonly) return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const getStarClass = (starValue: number) => {
    const baseClass = 'star';
    const sizeClass = `star--${size}`;
    const activeClass = (hoverRating || rating) >= starValue ? 'star--active' : '';
    const readonlyClass = readonly ? 'star--readonly' : '';
    
    return [baseClass, sizeClass, activeClass, readonlyClass]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div 
      className={`star-rating star-rating--${size} ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            className={getStarClass(starValue)}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            disabled={readonly}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
          >
            ★
          </button>
        );
      })}
      <span className="star-rating__text">
        {rating > 0 ? `${rating}/${maxRating}` : 'No rating'}
      </span>
    </div>
  );
};

export default StarRating;