import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export default function View({ userId }) {
  const router = useRouter();
  const { view } = router.query;
  const [partnerData, setPartnerData] = useState(null);
  const [error, setError] = useState(null);

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

  const renderComponent = () => {
    if (!partnerData) return null;

    switch (view) {
      case 'create-case':
        return <CreateCase partnerRef={userId} />;
      case 'view-case-status':
        return <ViewCaseStatus partnerRef={partnerData.partnerRef} />;
      case 'update-case-data':
        return <ViewUpdateCaseData partnerRef={partnerData.partnerRef} />;
      case 'raise-issue':
        return <RaiseIssue partnerRef={partnerData.partnerRef} />;
      default:
        router.push('/partnerDashboard');
        return null;
    }
  };

  return (
    <div>
      <div className="p-4">
        <button
          onClick={() => router.push('/partnerDashboard')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          ← Back to Dashboard
        </button>
      </div>
      {error ? (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      ) : (
        renderComponent()
      )}
    </div>
  );
} 