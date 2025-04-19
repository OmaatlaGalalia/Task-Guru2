import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-100">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-6 drop-shadow">Privacy Policy</h1>
      
      <p className="mb-4">Your privacy is important to us. This Privacy Policy explains how Task Guru collects, uses, discloses, and safeguards your information when you use our service.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Personal identification information (Name, email address, phone number, etc.)</li>
        <li>Usage data and cookies</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Information</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To provide and improve our services</li>
        <li>To communicate with you</li>
        <li>For security and fraud prevention</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Your Rights</h2>
      <p className="mb-4">You may access, update, or delete your personal information by contacting us. We respect your rights regarding your data.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at support@taskguru.com.</p>
      </div>
    </div>
  );
}
