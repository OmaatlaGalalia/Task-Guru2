import React from 'react';

export default function PaymentPage() {
  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Choose a Payment Method</h2>
      <p className="mb-6 text-gray-700">Select your preferred platform below. You will be redirected or shown instructions to complete your payment. After payment, please return to the app and mark your task as paid if necessary.</p>
      <div className="space-y-4">
        <a
          href="https://orangemoney.orange.co.bw/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 text-center font-semibold"
        >
          Pay with Orange Money
        </a>
        <a
          href="https://www.fnbbotswana.co.bw/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 bg-blue-800 text-white rounded hover:bg-blue-900 text-center font-semibold"
        >
          Pay with FNB
        </a>
        <a
          href="https://myzaka.co.bw/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 text-center font-semibold"
        >
          Pay with MyZaka
        </a>
        <a
          href="https://www.paypal.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 text-center font-semibold"
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
      <div className="mt-6 text-sm text-gray-500">
        <p>If you paid outside the app, please notify your tasker or upload proof of payment if required.</p>
      </div>
    </div>
  );
}
