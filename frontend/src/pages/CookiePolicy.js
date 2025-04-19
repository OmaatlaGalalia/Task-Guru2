import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-100">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-6 drop-shadow">Cookie Policy</h1>
      
      <p className="mb-4">This Cookie Policy explains how Task Guru uses cookies and similar technologies when you visit our website.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">What Are Cookies?</h2>
      <p className="mb-4">Cookies are small data files stored on your device. They help us improve your experience and analyze usage.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Cookies</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To remember your preferences</li>
        <li>For authentication and security</li>
        <li>To analyze site traffic</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Managing Cookies</h2>
      <p className="mb-4">You can control cookies through your browser settings. Disabling cookies may affect your experience.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact Us</h2>
      <p>If you have questions about our Cookie Policy, contact us at support@taskguru.com.</p>
      </div>
    </div>
  );
}
