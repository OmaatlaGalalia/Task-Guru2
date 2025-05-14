import React from 'react';

const CreditCardForm = ({ cardDetails, onChange, errors }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Card Number</label>
        <input
          type="text"
          name="cardNumber"
          value={cardDetails.cardNumber || ''}
          onChange={onChange}
          placeholder="1234 5678 9012 3456"
          className="w-full border rounded px-3 py-2"
          maxLength="19"
        />
        {errors?.cardNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
        )}
      </div>
      
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block font-medium">Expiry Date</label>
          <input
            type="text"
            name="expiryDate"
            value={cardDetails.expiryDate || ''}
            onChange={onChange}
            placeholder="MM/YY"
            className="w-full border rounded px-3 py-2"
            maxLength="5"
          />
          {errors?.expiryDate && (
            <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
          )}
        </div>
        
        <div className="flex-1">
          <label className="block font-medium">CVV</label>
          <input
            type="text"
            name="cvv"
            value={cardDetails.cvv || ''}
            onChange={onChange}
            placeholder="123"
            className="w-full border rounded px-3 py-2"
            maxLength="4"
          />
          {errors?.cvv && (
            <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block font-medium">Cardholder Name</label>
        <input
          type="text"
          name="cardholderName"
          value={cardDetails.cardholderName || ''}
          onChange={onChange}
          placeholder="John Doe"
          className="w-full border rounded px-3 py-2"
        />
        {errors?.cardholderName && (
          <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
        )}
      </div>
    </div>
  );
};

export default CreditCardForm;
