export const RESULT_PUBLISHED_NOTIFICATION = 'RESULT_PUBLISHED';

interface ResultPublishPayloadParams {
  studentId: string;
  studentName: string;
  academicYear: string;
  term: string;
  schoolName: string;
}

export function buildResultPublishPayload({
  studentId,
  studentName,
  academicYear,
  term,
  schoolName,
}: ResultPublishPayloadParams) {
  return JSON.stringify({
    type: RESULT_PUBLISHED_NOTIFICATION,
    studentId,
    studentName,
    academicYear,
    term,
    message: `${schoolName}: ${studentName}'s ${term} ${academicYear} results are now available.`,
  });
}

export function parseResultPublishPayload(value: string | null | undefined) {
  if (!value) return null;

  try {
    const payload = JSON.parse(value);
    if (payload?.type !== RESULT_PUBLISHED_NOTIFICATION) {
      return null;
    }

    return {
      studentId: String(payload.studentId || ''),
      studentName: String(payload.studentName || ''),
      academicYear: String(payload.academicYear || ''),
      term: String(payload.term || ''),
      message: String(payload.message || 'Results are now available.'),
    };
  } catch {
    return null;
  }
}

export function hasPublishedResult(
  notifications: Array<{ title: string; body: string }>,
  studentId: string,
  academicYear: string,
  term: string
) {
  return notifications.some((notification) => {
    if (notification.title !== RESULT_PUBLISHED_NOTIFICATION) {
      return false;
    }

    const payload = parseResultPublishPayload(notification.body);
    return (
      payload?.studentId === studentId &&
      payload.academicYear === academicYear &&
      payload.term === term
    );
  });
}
