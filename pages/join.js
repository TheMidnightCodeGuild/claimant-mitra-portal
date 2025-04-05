import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Join() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    source: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setError('');

    try {
      // Validate mobile number
      if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      const docData = {
        ...formData,
        mobile: formData.mobile ? Number(formData.mobile) : null,
        requestDate: new Date().toISOString(),
        status: 'pending',
        reviewed: false
      };

      await addDoc(collection(db, 'requests'), docData);
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center py-5 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/images/bgsignin.jpg')"
      }}
    >
      <div className="max-w-md mx-auto ">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-blue-900 p-6 sm:p-8">
          <div className="text-center mb-8">
            <Image src="/images/logo.png" width={100} height={100} alt="Logo" className="mx-auto h-16 sm:h-20 w-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Partner Application</h2>
            <p className="mt-2 text-gray-600">Join our network of insurance claim partners</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">Application submitted successfully!</p>
              <p className="text-green-600 mt-1">Redirecting you...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter your full name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter your email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile"
                  id="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Where are you from?
                </label>
                <input
                  type="text"
                  name="source"
                  id="source"
                  required
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="Enter your city/location"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
