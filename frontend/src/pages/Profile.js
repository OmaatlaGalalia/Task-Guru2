import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import CreditCardForm from '../components/CreditCardForm';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cardDetails, setCardDetails] = useState({});
  const [cardErrors, setCardErrors] = useState({});
  const [showCardForm, setShowCardForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setProfile(userData);
          
          // Initialize card details if they exist
          if (userData.cardDetails) {
            setCardDetails(userData.cardDetails);
            setShowCardForm(true);
          }
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e) => {
    setCardDetails({ ...cardDetails, [e.target.name]: e.target.value });
    
    // Clear error for this field when user types
    if (cardErrors[e.target.name]) {
      setCardErrors({ ...cardErrors, [e.target.name]: null });
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    setSaving(true);
    setError(null);
    
    // Don't set preview until Cloudinary upload completes
    setImagePreview(null);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'task-guru-profiles'); // Replace with your upload preset
      formData.append('cloud_name', 'dxldrbjqz'); // Your Cloudinary cloud name

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dxldrbjqz/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Validate the response URL
      if (!data.secure_url) {
        throw new Error('No secure URL received from Cloudinary');
      }

      // Get the secure URL from Cloudinary response
      const secureUrl = data.secure_url;
      console.log('Received Cloudinary URL:', secureUrl);
      
      if (!secureUrl.startsWith('https://')) {
        throw new Error('Invalid Cloudinary URL received');
      }

      // Update states with the Cloudinary URL
      setImagePreview(secureUrl);
      setProfile(prev => ({
        ...prev,
        photoURL: secureUrl
      }));

      // Update user profile with new image URL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: secureUrl
      });

      // Update profile state to reflect new image
      setProfile(prev => ({
        ...prev,
        photoURL: secureUrl
      }));

      setError(null);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setImagePreview(profile.photoURL || null);
    } finally {
      setSaving(false);
    }
  };

  const validateCardDetails = () => {
    const errors = {};
    
    // Only validate if card form is shown and has any values
    if (showCardForm && Object.values(cardDetails).some(val => val)) {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        errors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!cardDetails.expiryDate || !cardDetails.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        errors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      } else {
        // Check if card is expired
        const [month, year] = cardDetails.expiryDate.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        if (expiryDate < now) {
          errors.expiryDate = 'Card has expired';
        }
      }
      
      if (!cardDetails.cvv || !cardDetails.cvv.match(/^\d{3,4}$/)) {
        errors.cvv = 'Please enter a valid CVV';
      }
      
      if (!cardDetails.cardholderName) {
        errors.cardholderName = 'Please enter the cardholder name';
      }
    }
    
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Validate card details if form is shown
    if (showCardForm) {
      const validationErrors = validateCardDetails();
      if (Object.keys(validationErrors).length > 0) {
        setCardErrors(validationErrors);
        setSaving(false);
        return;
      }
    }
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const dataToUpdate = {
        ...profile,
        // Image URL is already saved in handleImageChange
      };
      
      // Only include card details if the form is shown
      if (showCardForm) {
        dataToUpdate.cardDetails = cardDetails;
      }
      
      await updateDoc(docRef, dataToUpdate);
      setError(null);
      alert('Profile updated!');
    } catch (err) {
      setError('Failed to update profile.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              key={imagePreview || profile.photoURL} // Force re-render on URL change
              src={imagePreview || profile.photoURL || '/images/default-avatar.svg'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover mb-2 border"
              onError={(e) => {
                console.error('Image failed to load. Current src:', e.target.src);
                // Only set default avatar if not already showing it
                if (e.target.src !== window.location.origin + '/images/default-avatar.svg') {
                  e.target.src = '/images/default-avatar.svg';
                }
              }}
            />
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white"></div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            disabled={saving}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <div>
          <label className="block font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={profile.firstName || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profile.lastName || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled
          />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input
            type="text"
            name="phone"
            value={profile.phone || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Address</label>
          <input
            type="text"
            name="address"
            value={profile.address || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Bio</label>
          <textarea
            name="bio"
            value={profile.bio || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Payment Information</h3>
            <button 
              type="button" 
              onClick={() => setShowCardForm(!showCardForm)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showCardForm ? 'Hide Card Form' : 'Add Credit Card'}
            </button>
          </div>
          
          {showCardForm && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Add your credit card details for faster payment at checkout. Your information is securely stored.
              </p>
              <CreditCardForm 
                cardDetails={cardDetails} 
                onChange={handleCardChange} 
                errors={cardErrors}
              />
            </>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
