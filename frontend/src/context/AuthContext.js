import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
    onAuthStateChanged,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // Get additional user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Check if the user has been deleted by admin
                        if (userData.isDeleted) {
                            // Sign out deleted users automatically
                            await firebaseSignOut(auth);
                            setUser(null);
                            alert('Your account has been deactivated. Please contact support for assistance.');
                        } else {
                            setUser({
                                ...currentUser,
                                ...userData
                            });
                        }
                    } else {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(currentUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    const value = {
        user,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
