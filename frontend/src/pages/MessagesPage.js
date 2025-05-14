import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatRoom from '../components/ChatRoom';
import { useParams } from 'react-router-dom';

export default function MessagesPage() {
  const { chatId } = useParams();
  return (
    <div className="flex h-[90vh] bg-[#222c36] rounded-lg overflow-hidden shadow-lg">
      <Sidebar selectedChatId={chatId} />
      <div className="flex-1 flex flex-col">
        {chatId ? <ChatRoom chatId={chatId} /> : (
          <div className="flex flex-1 items-center justify-center text-gray-400 text-xl">
            Select a conversation or start a new one.
          </div>
        )}
      </div>
    </div>
  );
}
