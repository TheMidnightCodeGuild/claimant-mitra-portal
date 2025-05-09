import { useState, useEffect } from 'react';
import { db, storage } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/router';

export default function CreateCase({ partnerRef }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    estimatedClaimAmount: '',
    mobile: '',
    email: '',
    companyName: '',
    claimNo: '',
    policyNo: '',
    policyHolder: '',
    aadharNo: '',
    address: ''
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileNames, setSelectedFileNames] = useState([]);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerRef) {
        setError('Partner reference not provided');
        return;
      }

      // try {
      //   const docRef = doc(db, 'partners', partnerRef);
      //   const docSnap = await getDoc(docRef);

      //   if (docSnap.exists()) {
      //     setPartnerData(docSnap.data());
      //   } else {
      //     setError('Partner data not found. Please check the partner reference.');
      //     router.push('/error');
      //   }
      // } catch (err) {
      //   console.error('Error fetching partner data:', err);
      //   setError('Failed to load partner data. Please try again later.');
      // }
    };

    fetchPartnerData();
  }, [partnerRef, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setSelectedFileNames(prevNames => [...prevNames, ...newFiles.map(file => file.name)]);
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setSelectedFileNames(prevNames => prevNames.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const uploadedUrls = [];
    let progress = 0;
    const increment = 100 / files.length;

    for (const file of files) {
      const storageRef = ref(storage, `case-files/${Date.now()}-${file.name}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
        
        progress += increment;
        setUploadProgress(Math.round(progress));
      } catch (err) {
        console.error('Error uploading file:', err);
        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let fileUrls = [];
      if (files.length > 0) {
        fileUrls = await uploadFiles();
      }

      // Create the user document with default values
      const userDoc = {
        ...formData,
        estimatedClaimAmount: formData.estimatedClaimAmount ? Number(formData.estimatedClaimAmount) : 0,
        mobile: formData.mobile ? Number(formData.mobile) : null,
        partnerRef: partnerRef,
        complaintDate: new Date().toISOString(),
        takenForReview: false,
        reviewDate: null,
        status: 'pending',
        documentShort: true,
        caseRejectionReason: '',
        caseRejectionDate: null,
        rejected: false,
        inReimbursement: false,
        isPending: false,
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
        ombudsmanFollowUpDate: null,
        ombudsmanComplaintNumber: '',
        sixAFormSubmitted: false,
        ombudsmanMode: '',
        ombudsmanLogs: [],
        ombudsmanRejectionReason: '',
        solved: false,
        solvedDate: null,
        claim: 0,
        commisionReceived: 0,
        partnerCommision: 0,
        fileBucket: fileUrls
      };

      // Add the document to Firestore
      await addDoc(collection(db, 'users'), userDoc);

      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push('/partnerDashboard').then(() => {
          router.reload();
        });
      }, 2000);

    } catch (err) {
      console.error('Error creating case:', err);
      setError('Failed to create case: ' + err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-50 py-4 sm:py-6 px-2 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-4 sm:p-8 md:p-12 rounded-2xl shadow-xl border-2 border-blue-900">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Create New Case</h2>
            <p className="text-sm sm:text-base text-gray-600">Please fill in the information below</p>
          </div>
          
          {showSuccessPopup && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Case created successfully!</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Personal Information Section */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter client's full name"
                  />
                </div>

                <div>
                  <label htmlFor="policyHolder" className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Holder Name
                  </label>
                  <input
                    type="text"
                    name="policyHolder"
                    id="policyHolder"
                    value={formData.policyHolder}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter policy holder's name"
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    id="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label htmlFor="aadharNo" className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    name="aadharNo"
                    id="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter Aadhar number"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              {/* Claim Information Section */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2">Claim Information</h3>
                
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter insurance company name"
                  />
                </div>

                <div>
                  <label htmlFor="estimatedClaimAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Claim Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="estimatedClaimAmount"
                    id="estimatedClaimAmount"
                    value={formData.estimatedClaimAmount}
                    onChange={handleChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                    placeholder="Enter estimated amount"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="claimNo" className="block text-sm font-medium text-gray-700 mb-1">
                      Claim Number
                    </label>
                    <input
                      type="text"
                      name="claimNo"
                      id="claimNo"
                      value={formData.claimNo}
                      onChange={handleChange}
                      className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                      placeholder="Enter claim number"
                    />
                  </div>

                  <div>
                    <label htmlFor="policyNo" className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      name="policyNo"
                      id="policyNo"
                      value={formData.policyNo}
                      onChange={handleChange}
                      className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm sm:text-base"
                      placeholder="Enter policy number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    id="files"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 text-sm sm:text-base"
                  />
                  {selectedFileNames.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedFileNames.map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600 truncate">{fileName}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="bg-blue-100 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm sm:text-base">Creating Case...</span>
                  </div>
                ) : (
                  'Create Case'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
