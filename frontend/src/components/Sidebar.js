import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import UserSearchModal from './UserSearchModal';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({ selectedChatId }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const chatsArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsArr);
      // Fetch user info for other participants
      const otherUids = Array.from(new Set(chatsArr.flatMap(chat => chat.members.filter(uid => uid !== user.uid))));
      if (otherUids.length) {
        const usersData = {};
        await Promise.all(otherUids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) usersData[uid] = userDoc.data();
        }));
        setUsersMap(usersData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Format the timestamp to a relative time (e.g., '2 hours ago')
  const formatMessageTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  return (
    <div className="w-80 bg-[#263142] text-white flex flex-col border-r border-gray-800">
      <div className="flex items-center p-4 border-b border-gray-700">
        <span className="font-bold text-lg flex-1">Recent Messages</span>
        <button 
          onClick={() => setShowUserSearch(true)} 
          className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 flex items-center justify-center"
          title="Start a new conversation"
        >
          <span>+</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Welcome message */}
        {chats.length === 0 && !loading && (
          <div className="flex items-center px-4 py-3 bg-[#1b2530] border-b border-gray-800 cursor-default">
            <img src="/task-guru-logo.png" alt="Task-Guru" className="w-10 h-10 rounded-full mr-3 border-2 border-blue-500" />
            <div className="flex-1">
              <div className="font-medium text-blue-400">Task-Guru</div>
              <div className="text-gray-300 text-sm">Welcome! Use the + button to start a new chat. Your recent conversations will appear here.</div>
            </div>
          </div>
        )}
        
        <input
          className="w-full p-2 bg-[#222c36] text-gray-300 border-b border-gray-700 outline-none"
          placeholder="Search conversations..."
          // TODO: Implement search filter
        />
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-400 mt-8 px-4">
            <p>No conversations yet.</p>
            <p className="mt-2 text-sm">Click the + button to start chatting or use the 'Message Now' button on task listings.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {chats.map(chat => {
              // Find the other participant
              const otherUid = chat.members.find(uid => uid !== user.uid);
              const otherUser = usersMap[otherUid] || {};
              const hasUnread = false; // TODO: Implement unread messages
              
              return (
                <div
                  key={chat.id}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-[#1b2530] ${
                    selectedChatId === chat.id ? 'bg-[#1b2530]' : ''
                  } ${hasUnread ? 'border-l-4 border-blue-500' : ''}`}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                >
                  <div className="relative">
                    <img 
                      src={otherUser.photoURL || '/images/default-avatar.svg'} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full mr-3 object-cover" 
                      onError={(e) => { e.target.src = '/images/default-avatar.svg'; }}
                    />
                    {hasUnread && (
                      <span className="absolute top-0 right-3 w-3 h-3 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-medium truncate">
                        {otherUser.firstName 
                          ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() 
                          : otherUser.displayName || otherUser.email || 'Unknown User'}
                      </div>
                      {chat.lastMessage?.timestamp && (
                        <div className="text-gray-500 text-xs flex-shrink-0 ml-1">
                          {formatMessageTime(chat.lastMessage.timestamp)}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-400 text-sm truncate">
                      {chat.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {showUserSearch && <UserSearchModal onClose={() => setShowUserSearch(false)} />}
    </div>
  );
}
