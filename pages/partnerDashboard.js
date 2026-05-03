import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import Image from 'next/image';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import PwaInstallButton from './components/PwaInstallButton';

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
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [childPartnersById, setChildPartnersById] = useState({});
  const [childLoadingById, setChildLoadingById] = useState({});
  const [childErrorById, setChildErrorById] = useState({});
  const [expandedChildrenById, setExpandedChildrenById] = useState({});
  const [showCasesById, setShowCasesById] = useState({});
  const [casesById, setCasesById] = useState({});
  const [casesLoadingById, setCasesLoadingById] = useState({});
  const [casesErrorById, setCasesErrorById] = useState({});
  const [stats, setStats] = useState({
    casesReferred: '0',
    totalEarnings: '₹0',
    referralCode: '-'
  });
  const router = useRouter();

  const handleLogout = () => {
    // Delete the session cookie
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to home page
    router.push('/');
  };

  const getPartnerType = (partner) => (partner?.partnerType === 'super' ? 'super' : 'normal');

  const chunkArray = (arr, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const fetchPartnersByIds = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const partnersCollection = collection(db, 'partners');
    const fetchedPartners = [];
    const idChunks = chunkArray(uniqueIds, 10);

    for (const idsChunk of idChunks) {
      const partnersQuery = query(partnersCollection, where(documentId(), 'in', idsChunk));
      const snapshot = await getDocs(partnersQuery);
      snapshot.forEach((partnerDoc) => {
        fetchedPartners.push({
          id: partnerDoc.id,
          ...partnerDoc.data(),
        });
      });
    }

    return fetchedPartners;
  };

  const fetchPartnersBySuperPartner = async (superPartnerId) => {
    if (!superPartnerId) {
      return [];
    }

    const partnersCollection = collection(db, 'partners');
    const partnersQuery = query(partnersCollection, where('superPartner', '==', superPartnerId));
    const snapshot = await getDocs(partnersQuery);

    return snapshot.docs.map((partnerDoc) => ({
      id: partnerDoc.id,
      ...partnerDoc.data(),
    }));
  };

  const fetchCasesForPartner = async (partnerId, partnerRef) => {
    if (!partnerRef) {
      setCasesById((prev) => ({ ...prev, [partnerId]: [] }));
      return;
    }

    setCasesLoadingById((prev) => ({ ...prev, [partnerId]: true }));
    setCasesErrorById((prev) => ({ ...prev, [partnerId]: '' }));

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('partnerRef', '==', partnerRef));
      const querySnapshot = await getDocs(q);
      const partnerCases = querySnapshot.docs.map((caseDoc) => ({
        id: caseDoc.id,
        ...caseDoc.data(),
      }));
      setCasesById((prev) => ({ ...prev, [partnerId]: partnerCases }));
    } catch (err) {
      console.error('Error fetching partner cases:', err);
      setCasesErrorById((prev) => ({ ...prev, [partnerId]: 'Failed to load partner cases' }));
    } finally {
      setCasesLoadingById((prev) => ({ ...prev, [partnerId]: false }));
    }
  };

  const toggleCasesForPartner = async (partner) => {
    const partnerId = partner?.id;
    if (!partnerId) {
      return;
    }

    const shouldShow = !showCasesById[partnerId];
    setShowCasesById((prev) => ({ ...prev, [partnerId]: shouldShow }));

    if (shouldShow && !casesById[partnerId] && !casesLoadingById[partnerId]) {
      await fetchCasesForPartner(partnerId, partner.partnerRef);
    }
  };

  const toggleChildrenForPartner = async (partner) => {
    const partnerId = partner?.id;
    if (!partnerId) {
      return;
    }

    const isExpanded = expandedChildrenById[partnerId];
    if (isExpanded) {
      setExpandedChildrenById((prev) => ({ ...prev, [partnerId]: false }));
      return;
    }

    setExpandedChildrenById((prev) => ({ ...prev, [partnerId]: true }));

    if (childPartnersById[partnerId]) {
      return;
    }

    setChildLoadingById((prev) => ({ ...prev, [partnerId]: true }));
    setChildErrorById((prev) => ({ ...prev, [partnerId]: '' }));

    try {
      const childIds = Array.isArray(partner.partnersUnder) ? partner.partnersUnder : [];
      let childPartners = [];

      if (childIds.length > 0) {
        childPartners = await fetchPartnersByIds(childIds);
      } else {
        childPartners = await fetchPartnersBySuperPartner(partnerId);
      }

      setChildPartnersById((prev) => ({ ...prev, [partnerId]: childPartners }));
    } catch (err) {
      console.error('Error fetching child partners:', err);
      setChildErrorById((prev) => ({ ...prev, [partnerId]: 'Failed to load partners under this partner' }));
      setChildPartnersById((prev) => ({ ...prev, [partnerId]: [] }));
    } finally {
      setChildLoadingById((prev) => ({ ...prev, [partnerId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const PartnerCasesTable = ({ partner }) => {
    const partnerCases = casesById[partner.id] || [];
    const loading = casesLoadingById[partner.id];
    const casesError = casesErrorById[partner.id];

    if (loading) {
      return <p className="text-sm text-gray-500 mt-3">Loading cases...</p>;
    }

    if (casesError) {
      return <p className="text-sm text-red-600 mt-3">{casesError}</p>;
    }

    if (partnerCases.length === 0) {
      return <p className="text-sm text-gray-500 mt-3">No cases found for this partner.</p>;
    }

    return (
      <div className="mt-3 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Mobile</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Case Accepted</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {partnerCases.map((partnerCase) => (
              <tr key={partnerCase.id}>
                <td className="px-3 py-2 text-sm text-gray-700">{partnerCase.name || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{partnerCase.mobile || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(partnerCase.reviewStatus)}`}>
                    {partnerCase.status || 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-700">{formatDate(partnerCase.caseAcceptanceDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const PartnerNode = ({ partner, depth = 0 }) => {
    const isSuperPartner = getPartnerType(partner) === 'super';
    const isChildrenExpanded = !!expandedChildrenById[partner.id];
    const isCasesShown = !!showCasesById[partner.id];
    const childPartners = childPartnersById[partner.id] || [];
    const childLoading = !!childLoadingById[partner.id];
    const childError = childErrorById[partner.id];

    return (
      <div
        className="mt-3 border border-gray-200 rounded-lg p-3 bg-white"
        style={{ marginLeft: depth === 0 ? 0 : `${depth * 16}px` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {partner.name || partner.email || partner.partnerRef || partner.id}
            </p>
            <p className="text-xs text-gray-600">
              Type: {isSuperPartner ? 'Super Partner' : 'Partner'} | Ref: {partner.partnerRef || '-'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleCasesForPartner(partner)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
            >
              {isCasesShown ? 'Hide Cases' : 'Show Cases'}
            </button>
            {isSuperPartner && (
              <button
                onClick={() => toggleChildrenForPartner(partner)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition duration-200"
              >
                {isChildrenExpanded ? 'Hide Partners Under' : 'Show Partners Under'}
              </button>
            )}
          </div>
        </div>

        {isCasesShown && <PartnerCasesTable partner={partner} />}

        {isChildrenExpanded && (
          <div className="mt-3">
            {childLoading && <p className="text-sm text-gray-500">Loading partners...</p>}
            {!childLoading && childError && <p className="text-sm text-red-600">{childError}</p>}
            {!childLoading && !childError && childPartners.length === 0 && (
              <p className="text-sm text-gray-500">No partners found under this partner.</p>
            )}
            {!childLoading && !childError && childPartners.length > 0 && (
              <div>
                {childPartners.map((childPartner) => (
                  <PartnerNode key={childPartner.id} partner={childPartner} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const showRootPartners = !!expandedChildrenById[userId];

  const handlePasswordReset = async (email) => {
    if (!email) {
      alert('Partner has no email address');
      return;
    }

    try {
      setPasswordResetLoading(true);
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error('Error sending password reset:', err);
      alert(`Failed to send password reset: ${err.message}`);
    } finally {
      setPasswordResetLoading(false);
    }
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
      case 'KPI Dashboard':
        router.push('/view?view=kpi');
        break;
      default:
        console.log(`Clicked ${action}`);
    }
  };

  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="p-4 sm:p-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="shrink-0">
                <Image src="/images/logo.png" width={100} height={100} alt="Logo" className="mx-auto h-14 w-auto sm:h-16 md:h-20" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">
                  {partnerData ? `Welcome, ${partnerData.email}` : 'Partner Dashboard'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">Manage your cases and track performance</p>
              </div>
            </div>
            <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:shrink-0 sm:justify-end w-full sm:w-auto">
              <PwaInstallButton variant="compact" />
              <button
                type="button"
                onClick={() => partnerData && handlePasswordReset(partnerData.email)}
                disabled={passwordResetLoading || !partnerData}
                className="flex-1 sm:flex-initial min-h-[44px] px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm sm:text-base rounded-lg transition duration-200 inline-flex items-center justify-center gap-2 touch-manipulation"
              >
                {passwordResetLoading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="sm:hidden">Reset</span>
                    <span className="hidden sm:inline">Reset Password</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 sm:flex-initial min-h-[44px] px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base rounded-lg transition duration-200 inline-flex items-center justify-center gap-2 touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                  <path d="M7 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200 w-full">
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

          {/* KPI Dashboard Card */}
          <div
            onClick={() => handleActionClick('KPI Dashboard')}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-100"
          >
            <div className="text-indigo-600 mb-3 sm:mb-4 bg-indigo-50 p-2 sm:p-3 rounded-lg inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">KPI Dashboard</h3>
            <p className="text-sm sm:text-base text-gray-600">Cases, pipeline, financials, and support metrics</p>
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

      {getPartnerType(partnerData) === 'super' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-semibold text-gray-800">Super Partner Hierarchy</h3>
                <p className="text-sm text-gray-600">Explore partners under your network and view their cases.</p>
              </div>
              <button
                onClick={() => toggleChildrenForPartner({ id: userId, ...partnerData })}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition duration-200"
              >
                {showRootPartners ? 'Hide Partners Under' : 'Show Partners Under'}
              </button>
            </div>

            {showRootPartners && (
              <div className="mt-4">
                {childLoadingById[userId] && <p className="text-sm text-gray-500">Loading partners...</p>}
                {!childLoadingById[userId] && childErrorById[userId] && (
                  <p className="text-sm text-red-600">{childErrorById[userId]}</p>
                )}
                {!childLoadingById[userId] &&
                  !childErrorById[userId] &&
                  (childPartnersById[userId] || []).length === 0 && (
                    <p className="text-sm text-gray-500">No partners found under you.</p>
                  )}
                {!childLoadingById[userId] &&
                  !childErrorById[userId] &&
                  (childPartnersById[userId] || []).length > 0 &&
                  childPartnersById[userId].map((partner) => (
                    <PartnerNode key={partner.id} partner={partner} depth={0} />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
