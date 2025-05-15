import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs, limit } from 'firebase/firestore';
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
    
    // Query for chats
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, async (snap) => {
      console.log('Fetched chats:', snap.docs.length);
      
      const chatsArr = snap.docs.map(doc => {
        const data = doc.data();
        console.log('Chat data for', doc.id, ':', data);
        return { id: doc.id, ...data };
      });
      
      // Fetch unread message counts for each chat and last messages
      const chatsWithUnreadCounts = await Promise.all(chatsArr.map(async (chat) => {
        try {
          console.log('Processing chat:', chat.id);
          
          // First, let's fetch the most recent message for this chat to ensure we have the latest
          // Messages are stored in a subcollection within each chat document
          const messagesQuery = query(
            collection(db, 'chats', chat.id, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          
          const messagesSnap = await getDocs(messagesQuery);
          let lastMessageText = 'No messages yet';
          let lastMessageData = null;
          
          if (!messagesSnap.empty) {
            lastMessageData = messagesSnap.docs[0].data();
            console.log('Last message data:', lastMessageData);
            if (lastMessageData.text) {
              lastMessageText = lastMessageData.text.length > 30 
                ? lastMessageData.text.substring(0, 30) + '...' 
                : lastMessageData.text;
            }
          } else if (chat.lastMessage && chat.lastMessage.text) {
            // Fallback to chat.lastMessage if no messages found but lastMessage exists in chat doc
            console.log('Using lastMessage from chat doc:', chat.lastMessage);
            lastMessageText = chat.lastMessage.text.length > 30 
              ? chat.lastMessage.text.substring(0, 30) + '...' 
              : chat.lastMessage.text;
          }
          
          // Query for unread messages in this chat
          // First, let's check if the 'read' field exists in messages
          let unreadCount = 0;
          try {
            // Get all messages in the chat
            // We need to create a separate query without the where clause first
            // because we can't combine inequality filters (!=) with orderBy on different fields
            const messagesRef = collection(db, 'chats', chat.id, 'messages');
            const allMessagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
            
            const allMessagesSnap = await getDocs(allMessagesQuery);
            
            // Count messages that are from other users and either explicitly marked as unread (read=false) or don't have a read field
            unreadCount = allMessagesSnap.docs.filter(doc => {
              const data = doc.data();
              // Only count messages from other users that are unread
              return data.senderId !== user.uid && (data.read === false || data.read === undefined);
            }).length;
            
            console.log('Chat', chat.id, '- Found', allMessagesSnap.docs.length, 'messages from others, with', unreadCount, 'unread');
            
            // Debug: Log each message's read status with more details
            allMessagesSnap.docs.forEach((doc, index) => {
              const data = doc.data();
              const isFromOther = data.senderId !== user.uid;
              const isUnread = data.read === false || data.read === undefined;
              const countedAsUnread = isFromOther && isUnread;
              
              console.log(
                `Message ${index}: ` +
                `from=${data.senderId === user.uid ? 'me' : 'other'}, ` +
                `read=${data.read}, ` +
                `countedAsUnread=${countedAsUnread}, ` +
                `timestamp=${data.timestamp?.toDate?.() || 'unknown'}, ` +
                `text=${data.text?.substring(0, 20) || 'empty'}...`
              );
            });
          } catch (error) {
            console.error('Error counting unread messages:', error);
          }
          
          return {
            ...chat,
            unreadCount,
            lastMessageText,
            lastMessageData
          };
        } catch (error) {
          console.error('Error fetching unread count for chat:', chat.id, error);
          return {
            ...chat,
            unreadCount: 0,
            lastMessageText: chat.lastMessage?.text || 'No messages yet'
          };
        }
      }));
      
      setChats(chatsWithUnreadCounts);
      
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
    <div className="w-80 bg-gradient-to-b from-white to-gray-50 text-gray-800 flex flex-col border-r border-gray-200 shadow-sm">
      <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-100 to-blue-50">
        <span className="font-bold text-lg flex-1 text-blue-800">Recent Messages</span>
        <button 
          onClick={() => setShowUserSearch(true)} 
          className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 flex items-center justify-center text-white"
          title="Start a new conversation"
        >
          <span>+</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Welcome message */}
        {chats.length === 0 && !loading && (
          <div className="flex items-center px-4 py-3 bg-blue-50 border-b border-blue-100 cursor-default m-2 rounded-lg shadow-sm">
            <img src="/task-guru-logo.png" alt="Task-Guru" className="w-10 h-10 rounded-full mr-3 border-2 border-blue-500" />
            <div className="flex-1">
              <div className="font-medium text-blue-600">Task-Guru</div>
              <div className="text-gray-600 text-sm">Welcome! Use the + button to start a new chat. Your recent conversations will appear here.</div>
            </div>
          </div>
        )}
        
        <input
          className="w-full p-3 bg-white text-gray-700 border-b border-gray-200 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
          placeholder="Search conversations..."
          // TODO: Implement search filter
        />
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-600 mt-8 px-4">
            <p>No conversations yet.</p>
            <p className="mt-2 text-sm">Click the + button to start chatting or use the 'Message Now' button on task listings.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats.map(chat => {
              // Find the other participant
              const otherUid = chat.members.find(uid => uid !== user.uid);
              const otherUser = usersMap[otherUid] || {};
              const hasUnread = chat.unreadCount > 0;
              
              // Debug logging for unread messages
              console.log(`Chat ${chat.id} with ${otherUser.firstName || otherUser.displayName || 'Unknown'}: Unread count = ${chat.unreadCount}`);
              
              return (
                <div
                  key={chat.id}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedChatId === chat.id ? 'bg-blue-50' : ''
                  } ${hasUnread ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white' : ''}`}
                  onClick={() => navigate(`/messages/${chat.id}`)}
                >
                  <div className="relative">
                    <img 
                      src={otherUser.photoURL || '/images/default-avatar.svg'} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full mr-3 object-cover" 
                      onError={(e) => { e.target.src = '/images/default-avatar.svg'; }}
                    />
                    {/* Always show the badge for debugging */}
                    <span 
                      className={`absolute top-0 right-2 w-6 h-6 ${hasUnread ? 'bg-blue-600' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg`}
                      style={{ transform: 'scale(1.2)', zIndex: 10 }}
                    >
                      {chat.unreadCount || '0'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-medium truncate text-gray-800">
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
                    
                    <div className="text-gray-600 text-sm truncate">
                      {chat.lastMessageText || (chat.lastMessageData && chat.lastMessageData.text) || (chat.lastMessage && chat.lastMessage.text) || 'No messages yet'}
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
