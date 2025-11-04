import React, { useState } from 'react';

interface StarRatingProps {
  rating: number; // Current rating (0-5)
  onRatingChange?: (rating: number) => void; // Callback when rating changes
  readOnly?: boolean; // If true, only display stars without interaction
  size?: 'small' | 'medium' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  readOnly = false,
  size = 'medium'
}) => {
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleStarClick = (starValue: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (!readOnly) {
      setHoveredRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredRating(0);
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return '16px';
      case 'large':
        return '24px';
      default:
        return '20px';
    }
  };

  const starSize = getStarSize();
  const displayRating = hoveredRating || rating;

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        gap: '2px',
        alignItems: 'center',
        cursor: readOnly ? 'default' : 'pointer'
      }}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = starValue <= displayRating;
        return (
          <span
            key={starValue}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            style={{
              fontSize: starSize,
              color: isFilled ? '#ffc107' : '#e0e0e0',
              transition: 'color 0.2s ease',
              cursor: readOnly ? 'default' : 'pointer',
              userSelect: 'none'
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;



