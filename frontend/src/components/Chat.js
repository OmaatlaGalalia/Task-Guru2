import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Chat component for a single task between two users (client & tasker).
 * Props:
 *   - taskId: string (Firestore task document ID)
 *   - taskerId: string (the other user in the chat)
 */
export default function Chat({ taskId, taskerId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Listen for messages in real-time
  useEffect(() => {
    if (!taskId) return;
    const messagesRef = collection(db, 'tasks', taskId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [taskId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks', taskId, 'messages'), {
        text: input,
        senderId: user.uid,
        receiverId: taskerId,
        timestamp: serverTimestamp(),
      });
      setInput('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] border rounded-lg shadow bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-10">No messages yet. Start the conversation!</div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`mb-3 flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs break-words shadow text-white ${msg.senderId === user.uid ? 'bg-blue-600' : 'bg-gray-400'}`}
            >
              {msg.text}
              <div className="text-xs text-right text-gray-200 mt-1">
                {msg.timestamp?.toDate?.().toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-2 border-t">
        <input
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
