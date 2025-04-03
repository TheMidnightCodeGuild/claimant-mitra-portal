import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function ViewUpdateCaseData({ partnerRef }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    estimatedClaimAmount: '',
    mobile: '',
    email: ''
  });

  useEffect(() => {
    if (!partnerRef) {
      setError('Partner reference not available');
      setLoading(false);
      return;
    }
    fetchCases();
  }, [partnerRef]);

  const fetchCases = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('partnerRef', '==', partnerRef)
      );

      const querySnapshot = await getDocs(q);
      const casesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCases(casesData);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to fetch cases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (caseItem) => {
    setEditingId(caseItem.id);
    setEditForm({
      name: caseItem.name || '',
      estimatedClaimAmount: caseItem.estimatedClaimAmount || '',
      mobile: caseItem.mobile || '',
      email: caseItem.email || ''
    });
  };

  const handleSave = async (id) => {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        name: editForm.name,
        estimatedClaimAmount: Number(editForm.estimatedClaimAmount),
        mobile: editForm.mobile,
        email: editForm.email
      });

      setCases(cases.map(c => 
        c.id === id 
          ? { ...c, ...editForm, estimatedClaimAmount: Number(editForm.estimatedClaimAmount) }
          : c
      ));
      setEditingId(null);
      alert('Case updated successfully!');
    } catch (err) {
      console.error('Error updating case:', err);
      alert('Failed to update case: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      estimatedClaimAmount: '',
      mobile: '',
      email: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            Case Details
          </h2>
          <p className="text-sm font-medium text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
            Partner ID: {partnerRef}
          </p>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No cases found for this partner</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-4 sm:p-6">
                  {/* Header Section */}
                  <div className="flex flex-wrap justify-between items-center mb-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{caseItem.name || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">Claim Amount: {formatCurrency(caseItem.estimatedClaimAmount || 0)}</p>
                    </div>
                    <div>
                      {editingId === caseItem.id ? (
                        <div className="flex space-x-2">
                          <button onClick={() => handleSave(caseItem.id)} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                            Save
                          </button>
                          <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(caseItem)} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                      {editingId === caseItem.id ? (
                        <div className="space-y-2">
                          <input type="tel" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} 
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Mobile"/>
                          <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Email"/>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">📱 {caseItem.mobile || 'N/A'}</p>
                          <p className="text-sm text-gray-600">✉️ {caseItem.email || 'N/A'}</p>
                        </>
                      )}
                    </div>

                    {/* Company Details */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Company Details</h4>
                      <p className="text-sm text-gray-600">Company: {caseItem.companyName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Claim #: {caseItem.claimNo || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Policy #: {caseItem.policyNo || 'N/A'}</p>
                    </div>

                    {/* Status & Review */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Status & Review</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(caseItem.reviewStatus)}`}>
                          {caseItem.reviewStatus || 'Pending'}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${caseItem.solved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {caseItem.solved ? 'Solved' : 'In Progress'}
                        </span>
                      </div>
                      {caseItem.caseRejectionReason && (
                        <p className="text-sm text-red-600">Rejection: {caseItem.caseRejectionReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${caseItem.documentShort ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          Documents: {caseItem.documentShort ? 'Incomplete' : 'Complete'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Acceptance Date: {formatDate(caseItem.caseAcceptanceDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
