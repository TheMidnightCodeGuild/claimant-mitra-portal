import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, startAfter } from 'firebase/firestore';

export default function RaiseIssue({ partnerRef }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newIssue, setNewIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const ISSUES_PER_PAGE = 5;

  useEffect(() => {
    if (partnerRef) {
      fetchIssues();
    }
  }, [partnerRef]);

  const fetchIssues = async (loadMore = false) => {
    try {
      let issuesQuery = query(
        collection(db, 'issues'),
        where('partnerRef', '==', partnerRef),
        orderBy('date', 'desc'),
        limit(ISSUES_PER_PAGE)
      );

      if (loadMore && lastVisible) {
        issuesQuery = query(
          collection(db, 'issues'),
          where('partnerRef', '==', partnerRef),
          orderBy('date', 'desc'),
          startAfter(lastVisible),
          limit(ISSUES_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(issuesQuery);
      
      // Update lastVisible for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      // Check if there are more issues to load
      setHasMore(querySnapshot.docs.length === ISSUES_PER_PAGE);

      const issuesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setIssues(prev => [...prev, ...issuesData]);
      } else {
        setIssues(issuesData);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to fetch issues: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newIssue.trim()) return;

    setSubmitting(true);
    try {
      const issueData = {
        message: newIssue.trim(),
        date: new Date().toISOString(),
        partnerRef,
        status: 'pending'
      };

      await addDoc(collection(db, 'issues'), issueData);
      
      // Reset form and refresh issues
      setNewIssue('');
      fetchIssues();
      
    } catch (err) {
      console.error('Error creating issue:', err);
      setError('Failed to create issue: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Issue Creation Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Raise New Issue</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                placeholder="Describe your issue..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </form>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Issues</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : issues.length === 0 ? (
            <p className="text-center text-gray-500">No issues found</p>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">
                      {formatDate(issue.date)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-gray-900">{issue.message}</p>
                </div>
              ))}
              
              {hasMore && (
                <button
                  onClick={() => fetchIssues(true)}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
