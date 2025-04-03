import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase'; // Import Firestore
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import dynamic from 'next/dynamic';

const CreateCase = dynamic(() => import('./components/createCase'));
const ViewCaseStatus = dynamic(() => import('./components/viewCaseStatus'));
const ViewUpdateCaseData = dynamic(() => import('./components/viewUpdateCaseData'));
const RaiseIssue = dynamic(() => import('./components/raiseIssue'));

export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies;

  if (!cookies.session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      userId: cookies.session,
    },
  };
}

export default function PartnerDashboard({ userId }) {
  const [partnerData, setPartnerData] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showViewCaseStatus, setShowViewCaseStatus] = useState(false);
  const [showViewUpdateCaseData, setShowViewUpdateCaseData] = useState(false);
  const [showRaiseIssue, setShowRaiseIssue] = useState(false);
  const router = useRouter();

  const stats = {
    casesReferred: partnerData ? partnerData.casesReferred : '',
    totalEarnings: partnerData ? partnerData.earning : '',
    referralCode: partnerData ? partnerData.partnerRef : ''
  };

  // Add a back button handler
  const handleBack = () => {
    setShowCreateCase(false);
    setShowViewCaseStatus(false);
    setShowViewUpdateCaseData(false);
    setShowRaiseIssue(false);
  };

  useEffect(() => {
    const fetchPartnerData = async () => {
      try {
        const docRef = doc(db, 'partners', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPartnerData(docSnap.data());
        } else {
          setError('Partner data not found');
        }
      } catch (err) {
        console.error('Error fetching partner data:', err);
        setError('Failed to load partner data');
      }
    };

    if (userId) {
      fetchPartnerData();
    }
  }, [userId]);

  const handleActionClick = (action) => {
    if (action === 'Create Case') {
      setShowCreateCase(true);
    } else if (action === 'View Case Status') {
      setShowViewCaseStatus(true);
    } else if (action === 'Update Case Data') {
      setShowViewUpdateCaseData(true);
    } else if (action === 'Raise Issue') {
      setShowRaiseIssue(true);
    } else {
      console.log(`Clicked ${action}`);
    }
  };

  if (showCreateCase) {
    return <CreateCase partnerRef={partnerData.partnerRef}/>;
  }

  if (showViewCaseStatus && partnerData) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="m-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          ← Back to Dashboard
        </button>
        <ViewCaseStatus partnerRef={partnerData.partnerRef} />
      </div>
    );
  }

  if (showViewUpdateCaseData && partnerData) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="m-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          ← Back to Dashboard
        </button>
        <ViewUpdateCaseData partnerRef={partnerData.partnerRef} />
      </div>
    );
  }

  if (showRaiseIssue && partnerData) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="m-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          ← Back to Dashboard
        </button>
        <RaiseIssue partnerRef={partnerData.partnerRef} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Header Section */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {partnerData ? `Welcome, ${partnerData.email}` : 'Partner Dashboard'}
          </h2>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>

      {/* Statistics Card */}
      <div className="max-w-7xl mx-auto px-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Cases Referred */}
            <div className="text-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Cases Referred</p>
              <p className="text-3xl font-bold text-blue-600">{stats.casesReferred}</p>
            </div>
            {/* Total Earnings */}
            <div className="text-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalEarnings}</p>
            </div>

            {/* Referral Code */}
            <div className="text-center p-4">
              <p className="text-sm font-semibold text-gray-600 mb-1">Referral Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-mono font-bold text-gray-800">{stats.referralCode}</p>
                <button 
                  onClick={() => navigator.clipboard.writeText(stats.referralCode)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Copy referral code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Create Case Card */}
          <div 
            onClick={() => handleActionClick('Create Case')}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer transform transition-transform hover:scale-105"
          >
            <div className="text-blue-600 mb-4">
              {/* You can add icons here */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Create Case</h3>
            <p className="mt-2 text-gray-600">Create a new case for processing</p>
          </div>

          {/* View Case Status Card */}
          <div 
            onClick={() => handleActionClick('View Case Status')}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer transform transition-transform hover:scale-105"
          >
            <div className="text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">View Case Status</h3>
            <p className="mt-2 text-gray-600">Check the status of existing cases</p>
          </div>

          {/* Raise Issue Card */}
          <div 
            onClick={() => handleActionClick('Raise Issue')}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer transform transition-transform hover:scale-105"
          >
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Raise Issue</h3>
            <p className="mt-2 text-gray-600">Report problems or raise concerns</p>
          </div>

          {/* Update Case Data Card */}
          <div 
            onClick={() => handleActionClick('Update Case Data')}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer transform transition-transform hover:scale-105"
          >
            <div className="text-purple-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">View / Update Case Data</h3>
            <p className="mt-2 text-gray-600">Modify existing case information</p>
          </div>
        </div>
      </div>
    </div>
  );
}
