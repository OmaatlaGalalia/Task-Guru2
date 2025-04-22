import React from 'react';
import { useParams } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';

export default function ReviewPage() {
  const { taskId, taskerId } = useParams();
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Leave a Review</h1>
      <ReviewForm taskId={taskId} taskerId={taskerId} />
    </div>
  );
}
