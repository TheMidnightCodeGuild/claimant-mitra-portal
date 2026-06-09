/* KPI Dashboard — temporarily disabled (do not delete). Uncomment to re-enable.

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  aggregateCaseMetrics,
  aggregateIssueMetrics,
  formatInr,
  formatPercent,
} from '../../lib/partnerKpi';

function KpiCard({ label, value, sublabel, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sublabel != null && sublabel !== '' && (
        <p className="mt-1 text-xs text-gray-500">{sublabel}</p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );
}

export default function PartnerKpiDashboard({ partnerRef }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseMetrics, setCaseMetrics] = useState(null);
  const [issueMetrics, setIssueMetrics] = useState(null);

  useEffect(() => {
    if (!partnerRef) {
      setError('Partner reference not available');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersQ = query(
          collection(db, 'users'),
          where('partnerRef', '==', partnerRef)
        );
        const issuesQ = query(
          collection(db, 'issues'),
          where('partnerRef', '==', partnerRef)
        );

        const [usersSnap, issuesSnap] = await Promise.all([
          getDocs(usersQ),
          getDocs(issuesQ),
        ]);

        const cases = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const issues = issuesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setCaseMetrics(aggregateCaseMetrics(cases));
        setIssueMetrics(aggregateIssueMetrics(issues));
      } catch (err) {
        console.error('Error loading KPI data:', err);
        setError(err.message || 'Failed to load KPI data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [partnerRef]);

  const statusEntries = useMemo(() => {
    if (!caseMetrics?.statusDistribution) return [];
    return Object.entries(caseMetrics.statusDistribution).sort((a, b) => b[1] - a[1]);
  }, [caseMetrics]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="mx-auto flex max-w-7xl justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const m = caseMetrics;
  const iss = issueMetrics;

  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-gradient-to-b from-blue-50 via-white to-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              Partner KPI Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600 break-words">
              Performance metrics for referral code{' '}
              <span className="font-mono font-semibold text-gray-800 break-all">{partnerRef}</span>
            </p>
          </div>
        </div>

        <Section title="Overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total cases" value={String(m.total)} />
            <KpiCard label="New cases (7 days)" value={String(m.newLast7d)} />
            <KpiCard label="New cases (30 days)" value={String(m.newLast30d)} />
            <KpiCard
              label="Acceptance rate"
              value={formatPercent(m.acceptanceRate)}
              sublabel={`${m.withAcceptanceDate} with acceptance date`}
            />
          </div>
        </Section>

        <Section title="Pipeline — review status">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <KpiCard label="Pending" value={String(m.reviewStatus.pending)} />
            <KpiCard label="Approved" value={String(m.reviewStatus.approved)} />
            <KpiCard label="Rejected" value={String(m.reviewStatus.rejected)} />
            <KpiCard label="Other" value={String(m.reviewStatus.other)} />
            <KpiCard label="Missing review" value={String(m.reviewStatus.missing)} />
          </div>
        </Section>

        <Section title="Pipeline — case status labels">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            {statusEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No status data.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {statusEntries.map(([key, count]) => (
                  <li
                    key={key}
                    className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="capitalize text-gray-700">{key}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="Resolution & documents">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Solved" value={String(m.solved)} />
            <KpiCard label="In progress" value={String(m.inProgress)} />
            <KpiCard label="Rejected (flag)" value={String(m.rejectedFlag)} />
            <KpiCard label="Documents complete" value={String(m.documentComplete)} />
            <KpiCard label="Documents incomplete" value={String(m.documentIncomplete)} />
          </div>
        </Section>

        <Section title="Financial">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard label="Estimated claim (sum)" value={formatInr(m.sumEstimatedClaim)} />
            <KpiCard label="Claim settled (sum)" value={formatInr(m.sumClaim)} />
            <KpiCard label="Partner commission (sum)" value={formatInr(m.sumPartnerCommission)} />
            <KpiCard label="Commission received (sum)" value={formatInr(m.sumCommissionReceived)} />
            <KpiCard
              label="Avg commission / case"
              value={formatInr(m.avgPartnerCommissionPerCase)}
            />
          </div>
        </Section>

        <Section title="Channels & process">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="IGMS" value={String(m.igmsCount)} />
            <KpiCard label="Ombudsman" value={String(m.ombudsmanCount)} />
            <KpiCard label="In reimbursement" value={String(m.inReimbursementCount)} />
          </div>
        </Section>

        <Section title="Timing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="Avg. days to acceptance"
              value={
                m.avgDaysToAccept != null ? `${m.avgDaysToAccept.toFixed(1)} days` : '—'
              }
              sublabel={
                m.avgDaysToAccept != null
                  ? `Sample: ${m.countDaysToAcceptSample} case(s) with complaint and acceptance dates`
                  : 'Add complaint and acceptance dates on cases to compute this'
              }
            />
            <KpiCard
              label="Cases with acceptance date"
              value={String(m.withAcceptanceDate)}
              sublabel={`of ${m.total} total`}
            />
          </div>
        </Section>

        <Section title="Support issues">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Total issues" value={String(iss.total)} />
            <KpiCard label="Pending" value={String(iss.pending)} />
            <KpiCard label="In progress" value={String(iss.inProgress)} />
            <KpiCard label="Resolved" value={String(iss.resolved)} />
            <KpiCard label="Other" value={String(iss.other)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

*/
