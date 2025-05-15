import React, { useEffect, useRef, useState } from 'react';
import { FaImage } from 'react-icons/fa';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ChatRoom({ chatId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user) return;
    
    // Query for messages
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
    
    const unsub = onSnapshot(q, async (snap) => {
      const messagesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
      
      // Mark messages from other users as read
      const batch = writeBatch(db);
      let hasUnreadMessages = false;
      
      snap.docs.forEach(doc => {
        const messageData = doc.data();
        // Only mark messages from other users that are unread
        if (messageData.senderId !== user.uid && messageData.read === false) {
          hasUnreadMessages = true;
          const messageRef = doc.ref;
          batch.update(messageRef, { read: true });
        }
      });
      
      // Only commit the batch if there are unread messages
      if (hasUnreadMessages) {
        try {
          // Reset the unread count in the chat document
          const chatRef = doc(db, 'chats', chatId);
          batch.update(chatRef, { unreadCount: 0 });
          
          // Commit all the updates in one batch
          await batch.commit();
          console.log('Marked messages as read and reset unread count');
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    });
    
    return () => unsub();
  }, [chatId, user]);

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

  const sendMessage = async (text) => {
    if (!text.trim() || !user) return;
    
    const timestamp = serverTimestamp();
    
    // Add the message to the subcollection
    const messageData = {
      text,
      senderId: user.uid,
      timestamp,
      read: false
    };
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.exists() ? chatDoc.data() : {};
      const currentUnreadCount = chatData.unreadCount || 0;
      
      await updateDoc(chatRef, {
        lastMessage: {
          text,
          senderId: user.uid,
          timestamp
        },
        updatedAt: timestamp,
        unreadCount: currentUnreadCount + 1
      });
    } catch (error) {
      console.error('Error updating chat with last message:', error);
    }
    
    setInput('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'task-guru-profiles'); // Using the same preset as profile images
      formData.append('cloud_name', 'dxldrbjqz'); // Your cloud name

      // Upload to Cloudinary
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dxldrbjqz/image/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        // Send message with image URL
        const timestamp = serverTimestamp();
        const messageData = {
          imageUrl: data.secure_url,
          senderId: user.uid,
          timestamp,
          read: false
        };

        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

        // Update chat document
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.exists() ? chatDoc.data() : {};
        const currentUnreadCount = chatData.unreadCount || 0;

        await updateDoc(chatRef, {
          lastMessage: {
            text: '📷 Image',
            senderId: user.uid,
            timestamp
          },
          updatedAt: timestamp,
          unreadCount: currentUnreadCount + 1
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    await sendMessage(input);
  };

  // Get other participant info
  let otherUser = null;
  if (chatInfo && chatInfo.membersInfo) {
    otherUser = chatInfo.membersInfo.find(m => m.uid !== user.uid);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-100 to-blue-50 shadow-sm">
        {otherUser ? (
          <>
            <img 
              src={otherUser.photoURL || '/images/default-avatar.svg'} 
              alt="avatar" 
              className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-white shadow-sm"
              onError={(e) => { e.target.src = '/images/default-avatar.svg'; }} 
            />
            <div className="flex-1">
              <div className="text-blue-800 font-bold text-lg">
                {otherUser.firstName 
                  ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() 
                  : otherUser.displayName || otherUser.email || 'Chat'}
              </div>
              {otherUser.email && <div className="text-gray-600 text-sm">{otherUser.email}</div>}
            </div>
          </>
        ) : (
          <div className="text-blue-800 font-bold text-lg">Loading conversation...</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-3 flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`${msg.imageUrl ? '' : 'px-4 py-2'} rounded-lg max-w-xs break-words ${msg.imageUrl ? '' : 'shadow'} ${
              msg.imageUrl ? '' : msg.senderId === user.uid 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {msg.imageUrl ? (
                <img 
                  src={msg.imageUrl} 
                  alt="" 
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(msg.imageUrl, '_blank')}
                />
              ) : (
                msg.text
              )}
              <div className={`text-xs text-right mt-1 ${msg.imageUrl ? 'text-gray-500' : msg.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'}`}>
                {msg.timestamp?.toDate?.().toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center p-3 bg-white border-t border-gray-200 shadow-sm">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors mr-2"
          disabled={uploading}
        >
          <FaImage className="w-5 h-5" />
        </button>
        <input
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
}

