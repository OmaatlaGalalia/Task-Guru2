import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-blue-100">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-6 drop-shadow">Terms of Service</h1>
      
      <p className="mb-4">These Terms of Service govern your use of Task Guru. By accessing or using our platform, you agree to these terms.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">User Responsibilities</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Provide accurate information</li>
        <li>Comply with all applicable laws</li>
        <li>Respect other users</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Prohibited Activities</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Fraudulent or illegal activities</li>
        <li>Harassment or abuse of others</li>
        <li>Unauthorized access to the platform</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of Liability</h2>
      <p className="mb-4">Task Guru is not liable for any damages resulting from your use of the platform. Use at your own risk.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact Us</h2>
      <p>If you have any questions about these Terms, contact us at support@taskguru.com.</p>
      </div>
    </div>
  );
}
