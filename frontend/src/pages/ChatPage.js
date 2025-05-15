import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Chat';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ChatPage() {
  const { taskId, taskerId } = useParams();
  const [otherUserName, setOtherUserName] = useState('');

  useEffect(() => {
    async function fetchUser() {
      if (!taskerId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', taskerId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          let name = '';
          if (data.firstName && data.lastName) {
            name = `${data.firstName} ${data.lastName}`;
          } else if (data.displayName) {
            name = data.displayName;
          } else if (data.email) {
            name = data.email;
          } else {
            name = 'User';
          }
          setOtherUserName(name);
        } else {
          setOtherUserName('User');
        }
      } catch (e) {
        setOtherUserName('User');
      }
    }
    fetchUser();
  }, [taskerId]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Chat with {otherUserName}</h1>
      <Chat taskId={taskId} taskerId={taskerId} />
    </div>
  );
}
