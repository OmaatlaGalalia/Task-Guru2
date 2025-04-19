import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Chat() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Mock data - replace with WebSocket/API later
  useEffect(() => {
    const mockMessages = [
      { id: 1, sender: 'Tasker', text: 'Hi there! When would you like me to come?', time: '10:30 AM' },
      { id: 2, sender: 'You', text: 'How about tomorrow at 2pm?', time: '10:32 AM' },
    ];
    setMessages(mockMessages);
  }, [conversationId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = {
      id: messages.length + 1,
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-medium">Conversation with Tasker</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${msg.sender === 'You' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'}`}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-blue-200' : 'text-gray-500'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}