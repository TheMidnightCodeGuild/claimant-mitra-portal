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

      // Update local state
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Case Details</h2>
          <p className="text-sm text-gray-600">Partner Reference: {partnerRef}</p>
        </div>
        
        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No cases found for this partner</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents & Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    {/* Client Details */}
                    <td className="px-4 py-4">
                      {editingId === caseItem.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Name"
                          />
                          <input
                            type="number"
                            value={editForm.estimatedClaimAmount}
                            onChange={(e) => setEditForm({ ...editForm, estimatedClaimAmount: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Claim Amount"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">{caseItem.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            Claim Amount: {formatCurrency(caseItem.estimatedClaimAmount || 0)}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td className="px-4 py-4">
                      {editingId === caseItem.id ? (
                        <div className="space-y-2">
                          <input
                            type="tel"
                            value={editForm.mobile}
                            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Mobile"
                          />
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Email"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-900">{caseItem.mobile || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{caseItem.email || 'N/A'}</div>
                        </>
                      )}
                    </td>

                    {/* Company Details */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{caseItem.companyName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        Claim #: {caseItem.claimNo || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Policy #: {caseItem.policyNo || 'N/A'}
                      </div>
                    </td>

                    {/* Case Status */}
                    <td className="px-4 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(caseItem.reviewStatus)}`}>
                        {caseItem.reviewStatus || 'Pending'}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {caseItem.solved ? 'Solved' : 'In Progress'}
                      </div>
                    </td>

                    {/* Review Details */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {caseItem.takenForReview ? 'Under Review' : 'Pending Review'}
                      </div>
                      {caseItem.caseRejectionReason && (
                        <div className="text-sm text-red-600 mt-1">
                          Rejection: {caseItem.caseRejectionReason}
                        </div>
                      )}
                    </td>

                    {/* Documents & Dates */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        Documents: {caseItem.documentShort ? 
                          <span className="text-red-600">Incomplete</span> : 
                          <span className="text-green-600">Complete</span>
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        Accepted: {formatDate(caseItem.caseAcceptanceDate)}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-4">
                      {editingId === caseItem.id ? (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleSave(caseItem.id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(caseItem)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
