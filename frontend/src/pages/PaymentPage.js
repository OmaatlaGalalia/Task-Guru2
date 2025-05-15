import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PaymentPage() {
  const { user } = useAuth();
  const [savedCard, setSavedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  // Error state for displaying error messages if card fetch fails
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchUserCard = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().cardDetails) {
          setSavedCard(userDoc.data().cardDetails);
        }
      } catch (err) {
        console.error('Error fetching user card details:', err);
        setError('Could not load your saved payment methods');
        // Display error message if needed
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserCard();
  }, [user]);
  
  const handlePayWithSavedCard = () => {
    // In a real implementation, this would call the Stripe API to process payment
    // For now, we'll just show an alert
    alert(`Payment processed with card ending in ${savedCard.cardNumber.slice(-4)}`);
  };
  // Show loading state while fetching card details
  if (loading) {
    return <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow text-center">Loading payment options...</div>;
  }

  // Show error message if there was a problem loading payment methods
  if (error) {
    return <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Choose a Payment Method</h2>
      <p className="mb-6 text-gray-700">Select your preferred payment method below. After payment, please return to the app and mark your task as paid if necessary.</p>
      
      <div className="space-y-4">
        {savedCard && (
          <div className="border rounded p-4 mb-6">
            <h3 className="font-semibold mb-2">Your Saved Card</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">•••• •••• •••• {savedCard.cardNumber.slice(-4)}</p>
                <p className="text-sm text-gray-600">{savedCard.cardholderName} | Expires: {savedCard.expiryDate}</p>
              </div>
              <button
                onClick={handlePayWithSavedCard}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center font-semibold"
              >
                Pay Now
              </button>
            </div>
          </div>
        )}
        
        {!savedCard && (
          <div className="border rounded p-4 mb-6 bg-gray-50">
            <p className="text-center text-gray-700">
              No saved card found. You can add a card in your <a href="/profile" className="text-blue-600 hover:underline">profile settings</a>.
            </p>
          </div>
        )}
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-4">Other Payment Methods</h3>
          
          <a
            href="https://orangemoney.orange.co.bw/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 text-center font-semibold mb-3"
          >
            Pay with Orange Money
          </a>
          <a
            href="https://www.fnbbotswana.co.bw/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-blue-800 text-white rounded hover:bg-blue-900 text-center font-semibold mb-3"
          >
            Pay with FNB
          </a>
          <a
            href="https://myzaka.co.bw/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 text-center font-semibold mb-3"
          >
            Pay with MyZaka
          </a>
          <a
            href="https://www.paypal.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 text-center font-semibold mb-3"
          >
            Pay with PayPal
          </a>
          <a
            href="https://www.flutterwave.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-center font-semibold"
          >
            Pay with Flutterwave
          </a>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>If you paid outside the app, please notify your tasker or upload proof of payment if required.</p>
      </div>
    </div>
  );
}
