import { useState } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const [files, setFiles] = useState([]);
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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const uploadFiles = async () => {
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `partner-documents/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      let fileBucket = [];
      if (files.length > 0) {
        fileBucket = await uploadFiles();
      }

      const docData = {
        ...formData,
        mobile: formData.mobile ? Number(formData.mobile) : null,
        requestDate: new Date().toISOString(),
        status: 'pending',
        reviewed: false,
        fileBucket
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
    <div className="min-h-screen bg-cover bg-center px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
      style={{
        backgroundImage: "url('/images/bgsignin.jpg')"
      }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        
        {/* Left Content Section */}
        <div className="text-left px-2 sm:px-4 py-4 sm:py-6">
          <div className="max-w-lg mx-auto lg:mx-0">
            <Image 
              src="/images/join.png" 
              width={400} 
              height={300} 
              alt="Join illustration" 
              className="w-full h-auto max-w-sm sm:max-w-md mx-auto lg:mx-0 mb-4 sm:mb-6"
              priority 
            />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Transform Insurance Claims with Us</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Partner with us to revolutionize the insurance claims industry and create better experiences for customers.</p>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-sm sm:text-base">Growing Partner Network</h3>
                <p className="text-xs sm:text-sm text-gray-500">Join thousands of successful claim partners nationwide</p>
              </div>
              
              <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-sm sm:text-base">Rewarding Partnership</h3>
                <p className="text-xs sm:text-sm text-gray-500">Benefit from our competitive commission structure and incentives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="backdrop-blur-sm rounded-2xl shadow-xl border-2 border-blue-900 p-4 sm:p-6 lg:p-8 max-w-lg mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <Image 
              src="/images/logo.png" 
              width={120} 
              height={120} 
              alt="Logo" 
              className="mx-auto h-14 sm:h-16 lg:h-20 w-auto mb-3 sm:mb-4"
              priority
            />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Partner Application</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">Join our network of insurance claim partners</p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-green-800 font-medium text-sm sm:text-base">Application submitted successfully!</p>
              <p className="text-green-600 mt-1 text-xs sm:text-sm">Redirecting you...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter your full name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter your email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
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
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Where are you from?</label>
                <input
                  type="text"
                  name="source"
                  id="source"
                  required
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="Enter your city/location"
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="documents" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
                <input
                  type="file"
                  id="documents"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">You can upload multiple documents</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 sm:py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${
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
