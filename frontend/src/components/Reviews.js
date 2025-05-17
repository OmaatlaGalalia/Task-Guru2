import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

export default function Reviews({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700">{review.reviewerName}</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {review.createdAt ? 
                (typeof review.createdAt.toDate === 'function' 
                  ? format(review.createdAt.toDate(), 'MMM d, yyyy')
                  : format(new Date(review.createdAt), 'MMM d, yyyy')
                ) : ''}
              
            </span>
          </div>
          <p className="text-gray-700">{review.review}</p>
        </div>
      ))}
    </div>
  );
}
