import React, { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ChatRoom({ chatId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat info for header
  useEffect(() => {
    if (!chatId) return;
    const fetchChat = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) setChatInfo(chatDoc.data());
    };
    fetchChat();
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: input,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    setInput('');
  };

  // Get other participant info
  let otherUser = null;
  if (chatInfo && chatInfo.membersInfo) {
    otherUser = chatInfo.membersInfo.find(m => m.uid !== user.uid);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 bg-[#232e3a] border-b border-gray-800">
        {otherUser ? (
          <>
            <img 
              src={otherUser.photoURL || '/images/default-avatar.svg'} 
              alt="avatar" 
              className="w-10 h-10 rounded-full mr-3 object-cover"
              onError={(e) => { e.target.src = '/images/default-avatar.svg'; }} 
            />
            <div className="flex-1">
              <div className="text-white font-bold text-lg">
                {otherUser.firstName 
                  ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() 
                  : otherUser.displayName || otherUser.email || 'Chat'}
              </div>
              {otherUser.email && <div className="text-gray-400 text-sm">{otherUser.email}</div>}
            </div>
          </>
        ) : (
          <div className="text-white font-bold text-lg">Loading conversation...</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-[#232e3a]">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-3 flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs break-words shadow text-white ${msg.senderId === user.uid ? 'bg-blue-600' : 'bg-gray-600'}`}>
              {msg.text}
              <div className="text-xs text-right text-gray-200 mt-1">
                {msg.timestamp?.toDate?.().toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-2 bg-[#263142] border-t border-gray-800">
        <input
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none bg-[#222c36] text-white"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
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

