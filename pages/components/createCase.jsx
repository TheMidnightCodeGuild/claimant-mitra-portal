import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function CreateCase() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    estimatedClaimAmount: '',
    mobile: '',
    email: '',
    companyName: '',
    claimNo: '',
    policyNo: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create the user document with default values
      const userDoc = {
        ...formData,
        estimatedClaimAmount: Number(formData.estimatedClaimAmount),
        mobile: Number(formData.mobile),
        partnerRef: partnerData ? partnerData.partnerRef : '', // Default values start here
        complaintDate: new Date().toISOString(),
        takenForReview: false,
        reviewStatus: 'pending',
        documentShort: true,
        caseRejectionReason: '',
        caseAcceptanceDate: null,
        mainLogs: [],
        internalLogs: [],
        igms: false,
        igmsDate: null,
        igmsFollowUpDate: null,
        igmsLogs: [],
        igmsRejectionReason: '',
        ombudsman: false,
        ombudsmanDate: null,
        ombudsmanCourierDate: null,
        ombudsmanCheckDate: null,
        ombudsmanComplaintNumber: '',
        sixAFormSubmitted: false,
        ombudsmanMode: '',
        ombudsmanLogs: [],
        ombudsmanRejectionReason: '',
        solved: false,
        claim: 0,
        commisionReceived: 0,
        partnerCommision: 0
      };

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'users'), userDoc);
      alert('Case created successfully!');
      router.push('/partnerDashboard').then(() => {
        router.reload();
      }); // Redirect back to dashboard and reload
    } catch (err) {
      setError('Failed to create case: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-10 rounded-xl shadow-lg">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Create New Case</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-800">
                Client Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Estimated Claim Amount Input */}
            <div>
              <label htmlFor="estimatedClaimAmount" className="block text-lg font-medium text-gray-800">
                Estimated Claim Amount
              </label>
              <input
                type="number"
                name="estimatedClaimAmount"
                id="estimatedClaimAmount"
                required
                value={formData.estimatedClaimAmount}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Mobile Input */}
            <div>
              <label htmlFor="mobile" className="block text-lg font-medium text-gray-800">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                id="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-800">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Company Name Input */}
            <div>
              <label htmlFor="companyName" className="block text-lg font-medium text-gray-800">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Claim Number Input */}
            <div>
              <label htmlFor="claimNo" className="block text-lg font-medium text-gray-800">
                Claim Number
              </label>
              <input
                type="text"
                name="claimNo"
                id="claimNo"
                required
                value={formData.claimNo}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Policy Number Input */}
            <div>
              <label htmlFor="policyNo" className="block text-lg font-medium text-gray-800">
                Policy Number
              </label>
              <input
                type="text"
                name="policyNo"
                id="policyNo"
                required
                value={formData.policyNo}
                onChange={handleChange}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => router.push('/partnerDashboard')}
                className="px-5 py-3 text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )};
