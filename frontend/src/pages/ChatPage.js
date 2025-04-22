import React from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Chat';

export default function ChatPage() {
  const { taskId, taskerId } = useParams();
  // Pass taskId and taskerId as props or context to Chat if needed
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Chat with Tasker</h1>
      <Chat taskId={taskId} taskerId={taskerId} />
    </div>
  );
}
