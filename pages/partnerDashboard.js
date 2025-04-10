import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const CreateCase = dynamic(() => import('./components/createCase'));
const ViewCaseStatus = dynamic(() => import('./components/viewCaseStatus'));
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
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [stats, setStats] = useState({
    casesReferred: '0',
    totalEarnings: '₹0',
    referralCode: '-'
  });
  const router = useRouter();

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
          const data = docSnap.data();
          setPartnerData(data);

          // Count cases and calculate total earnings for this partner
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('partnerRef', '==', data.partnerRef));
          const querySnapshot = await getDocs(q);
          
          let totalCommission = 0;
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            totalCommission += userData.partnerCommision || 0;
          });

          setStats({
            casesReferred: querySnapshot.size.toString(),
            totalEarnings: `₹${totalCommission}`,
            referralCode: data.partnerRef || '-'
          });

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
    switch (action) {
      case 'Create Case':
        router.push('/view?view=create-case');
        break;
      case 'View Case Status':
        router.push('/view?view=view-case-status');
        break;
      case 'Raise Issue':
        router.push('/view?view=raise-issue');
        break;
      default:
        console.log(`Clicked ${action}`);
    }
  };

  const BackButton = () => (
    <button
      onClick={handleBack}
      className="m-2 sm:m-4 px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 ease-in-out flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Dashboard
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="p-4 sm:p-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-0 flex items-center">
          <div className="mr-4">
          <Image src="/images/logo.png" width={100} height={100} alt="Logo" className="mx-auto h-16 sm:h-20 w-auto" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 mx-44">
              {partnerData ? `Welcome, ${partnerData.email}` : 'Partner Dashboard'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mx-60">Manage your cases and track performance</p>
          </div>
          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm sm:text-base text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 sm:mt-5">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Cases Referred */}
            <div className="p-4 sm:p-6 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-2">Cases Referred</p>
              <p className="text-2xl sm:text-4xl font-bold text-blue-700">{stats.casesReferred}</p>
            </div>
            
            {/* Total Earnings */}
            <div className="p-4 sm:p-6 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-xs sm:text-sm font-semibold text-purple-600 mb-2">Total Earnings</p>
              <p className="text-2xl sm:text-4xl font-bold text-purple-700">{stats.totalEarnings}</p>
            </div>

            {/* Referral Code */}
            <div className="p-4 sm:p-6 rounded-lg bg-gray-50 border border-gray-100 relative">
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">Referral Code</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-xl sm:text-3xl font-mono font-bold text-gray-800">{stats.referralCode}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(stats.referralCode);
                    setShowCopyPopup(true);
                    setTimeout(() => setShowCopyPopup(false), 2000);
                  }}
                  className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition duration-200"
                  title="Copy referral code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              {showCopyPopup && (
                <div className="absolute top-0 right-0 mt-2 mr-2 bg-black text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                  Copied!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <h3 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Create Case Card */}
          <div 
            onClick={() => handleActionClick('Create Case')}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
          >
            <div className="text-blue-600 mb-3 sm:mb-4 bg-blue-50 p-2 sm:p-3 rounded-lg inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Create Case</h3>
            <p className="text-sm sm:text-base text-gray-600">Create a new case for processing</p>
          </div>

          {/* View Case Status Card */}
          <div 
            onClick={() => handleActionClick('View Case Status')}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
          >
            <div className="text-green-600 mb-3 sm:mb-4 bg-green-50 p-2 sm:p-3 rounded-lg inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">View Case Status</h3>
            <p className="text-sm sm:text-base text-gray-600">Check the status of existing cases</p>
          </div>

          {/* Raise Issue Card */}
          <div 
            onClick={() => handleActionClick('Raise Issue')}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
          >
            <div className="text-red-600 mb-3 sm:mb-4 bg-red-50 p-2 sm:p-3 rounded-lg inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Raise Issue</h3>
            <p className="text-sm sm:text-base text-gray-600">Report problems or raise concerns</p>
          </div>

          {/* Update Case Data Card */}
          {/* <div 
            onClick={() => handleActionClick('Update Case Data')}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
          >
            <div className="text-purple-600 mb-3 sm:mb-4 bg-purple-50 p-2 sm:p-3 rounded-lg inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">View / Update Case Data</h3>
            <p className="text-sm sm:text-base text-gray-600">Modify existing case information</p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
