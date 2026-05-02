/**
 * Pure aggregations for partner KPI dashboard (users = cases, issues = support tickets).
 */

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value) {
  if (value == null) return null;
  if (value?.toDate && typeof value.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeReviewStatus(rs) {
  if (rs == null || rs === '') return 'missing';
  const s = String(rs).toLowerCase().trim();
  if (s === 'pending') return 'pending';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'other';
}

function normalizeStatusLabel(status) {
  const s = status == null || status === '' ? 'unknown' : String(status).toLowerCase().trim();
  return s || 'unknown';
}

function normalizeIssueStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  if (s === 'pending') return 'pending';
  if (s === 'in-progress' || s === 'in_progress') return 'inProgress';
  if (s === 'resolved') return 'resolved';
  return 'other';
}

/**
 * @param {Array<Record<string, unknown>>} cases - Plain objects from user/case docs (spread doc.data()).
 * @returns {object} Aggregated metrics for UI
 */
export function aggregateCaseMetrics(cases) {
  const now = Date.now();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  const reviewStatus = { pending: 0, approved: 0, rejected: 0, other: 0, missing: 0 };
  const statusDistribution = {};
  const statusWhenReviewMissing = {};

  let total = 0;
  let newLast7d = 0;
  let newLast30d = 0;
  let solved = 0;
  let inProgress = 0;
  let rejectedFlag = 0;
  let documentComplete = 0;
  let documentIncomplete = 0;
  let sumEstimatedClaim = 0;
  let sumClaim = 0;
  let sumPartnerCommission = 0;
  let sumCommissionReceived = 0;
  let igmsCount = 0;
  let ombudsmanCount = 0;
  let inReimbursementCount = 0;
  let withAcceptanceDate = 0;
  let totalDaysToAccept = 0;
  let countDaysToAccept = 0;

  for (const c of cases) {
    total += 1;

    const complaint = parseDate(c.complaintDate);
    if (complaint) {
      const t = complaint.getTime();
      if (now - t <= ms7d) newLast7d += 1;
      if (now - t <= ms30d) newLast30d += 1;
    }

    const rs = normalizeReviewStatus(c.reviewStatus);
    if (rs === 'missing') {
      reviewStatus.missing += 1;
    } else {
      reviewStatus[rs] = (reviewStatus[rs] || 0) + 1;
    }

    const stLabel = normalizeStatusLabel(c.status);
    statusDistribution[stLabel] = (statusDistribution[stLabel] || 0) + 1;
    if (c.reviewStatus == null || c.reviewStatus === '') {
      statusWhenReviewMissing[stLabel] = (statusWhenReviewMissing[stLabel] || 0) + 1;
    }

    if (c.solved === true) solved += 1;
    else inProgress += 1;

    if (c.rejected === true) rejectedFlag += 1;

    if (c.documentShort === false) documentComplete += 1;
    else documentIncomplete += 1;

    sumEstimatedClaim += toNumber(c.estimatedClaimAmount);
    sumClaim += toNumber(c.claim);
    sumPartnerCommission += toNumber(c.partnerCommision);
    sumCommissionReceived += toNumber(c.commisionReceived);

    if (c.igms === true) igmsCount += 1;
    if (c.ombudsman === true) ombudsmanCount += 1;
    if (c.inReimbursement === true) inReimbursementCount += 1;

    const accept = parseDate(c.caseAcceptanceDate);
    if (accept) {
      withAcceptanceDate += 1;
      if (complaint) {
        const days = (accept.getTime() - complaint.getTime()) / (24 * 60 * 60 * 1000);
        if (days >= 0 && Number.isFinite(days)) {
          totalDaysToAccept += days;
          countDaysToAccept += 1;
        }
      }
    }
  }

  const avgPartnerCommissionPerCase = total > 0 ? sumPartnerCommission / total : 0;
  const acceptanceRate = total > 0 ? withAcceptanceDate / total : 0;
  const avgDaysToAccept =
    countDaysToAccept > 0 ? totalDaysToAccept / countDaysToAccept : null;

  return {
    total,
    newLast7d,
    newLast30d,
    reviewStatus,
    statusDistribution,
    statusWhenReviewMissing,
    solved,
    inProgress,
    rejectedFlag,
    documentComplete,
    documentIncomplete,
    sumEstimatedClaim,
    sumClaim,
    sumPartnerCommission,
    sumCommissionReceived,
    avgPartnerCommissionPerCase,
    igmsCount,
    ombudsmanCount,
    inReimbursementCount,
    withAcceptanceDate,
    acceptanceRate,
    avgDaysToAccept,
    countDaysToAcceptSample: countDaysToAccept,
  };
}

/**
 * @param {Array<Record<string, unknown>>} issues - Plain objects from issue docs
 */
export function aggregateIssueMetrics(issues) {
  const out = {
    total: issues.length,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    other: 0,
  };
  for (const issue of issues) {
    const bucket = normalizeIssueStatus(issue.status);
    if (bucket === 'pending') out.pending += 1;
    else if (bucket === 'inProgress') out.inProgress += 1;
    else if (bucket === 'resolved') out.resolved += 1;
    else out.other += 1;
  }
  return out;
}

export function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatPercent(ratio) {
  if (!Number.isFinite(ratio)) return '0%';
  return `${(ratio * 100).toFixed(1)}%`;
}
