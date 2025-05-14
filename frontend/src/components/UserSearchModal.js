import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserSearchModal({ onClose }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.uid !== user.uid));
    };
    fetchUsers();
  }, [user]);

  const getChatKey = (uid1, uid2) => [uid1, uid2].sort().join('_');

  const handleStartChat = async (otherUser) => {
    try {
      const chatKey = getChatKey(user.uid, otherUser.uid);
      
      // 1. First check if chat exists
      const chatQ = query(collection(db, 'chats'), where('chatKey', '==', chatKey));
      const chatSnap = await getDocs(chatQ);
      
      if (!chatSnap.empty) {
        navigate(`/messages/${chatSnap.docs[0].id}`);
        onClose();
        return;
      }

      // 2. Get current user details
      let currentUserData = { displayName: user.email, photoURL: null };
      try {
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
        if (currentUserDoc.exists()) {
          currentUserData = currentUserDoc.data();
        }
      } catch (err) {
        console.warn('Could not fetch current user data:', err);
      }
  
      // 3. Create membersInfo array for easy display
      const membersInfo = [
        {
          uid: user.uid,
          displayName: currentUserData.firstName 
            ? `${currentUserData.firstName} ${currentUserData.lastName || ''}`.trim() 
            : currentUserData.displayName || user.email,
          photoURL: currentUserData.photoURL || '',
          email: currentUserData.email || user.email,
          firstName: currentUserData.firstName || '',
          lastName: currentUserData.lastName || ''
        },
        {
          uid: otherUser.uid,
          displayName: otherUser.firstName 
            ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() 
            : otherUser.displayName || otherUser.email,
          photoURL: otherUser.photoURL || '',
          email: otherUser.email || '',
          firstName: otherUser.firstName || '',
          lastName: otherUser.lastName || ''
        }
      ];

      // 4. Create new chat with complete structure
      const chatDoc = await addDoc(collection(db, 'chats'), {
        members: [user.uid, otherUser.uid].sort(),
        chatKey: chatKey,
        membersInfo: membersInfo,
        lastMessage: {
          text: '',
          timestamp: serverTimestamp()
        },
        createdAt: serverTimestamp()
      });
  
      // 5. Navigate to the new chat
      onClose();
      navigate(`/messages/${chatDoc.id}`);
      
    } catch (error) {
      console.error("Error creating chat:", {
        message: error.message,
        code: error.code,
        details: error.details
      });
      alert(`Failed to create chat: ${error.message}
Check console for details`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#263142] p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-white font-bold text-lg">Start a new chat</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <input
          className="w-full p-2 mb-4 rounded bg-[#222c36] text-white border border-gray-700 outline-none"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div>
          {users.filter(u => {
            const name = u.firstName ? `${u.firstName} ${u.lastName}` : u.displayName || u.email;
            return name.toLowerCase().includes(search.toLowerCase());
          }).map(u => (
            <div key={u.uid} className="flex items-center mb-3 p-2 rounded hover:bg-[#1b2530] cursor-pointer" onClick={() => handleStartChat(u)}>
              <img src={u.photoURL || '/images/default-avatar.svg'} alt="avatar" className="w-10 h-10 rounded-full mr-3" onError={(e) => { e.target.src = '/images/default-avatar.svg'; }} />
              <div>
                <div className="text-white font-medium">{u.firstName ? `${u.firstName} ${u.lastName}` : u.displayName || u.email}</div>
                <div className="text-gray-400 text-sm">{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
