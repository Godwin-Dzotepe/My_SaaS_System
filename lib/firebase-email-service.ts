import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface FirebaseEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface LeadEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getFirebaseCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function ensureFirebaseAdminInitialized(): FirebaseEmailResult {
  if (getApps().length > 0) {
    return { success: true };
  }

  const { projectId, clientEmail, privateKey } = getFirebaseCredentials();
  const allowDevLogOnly = process.env.EMAIL_DEV_LOG_ONLY === 'true';

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'development' && allowDevLogOnly) {
      return { success: true, messageId: `dev-email-log-${Date.now()}` };
    }

    return {
      success: false,
      error:
        'Firebase email is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    };
  }

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize Firebase Admin SDK.',
    };
  }
}

export async function queueLeadEmailInFirebase(payload: LeadEmailPayload): Promise<FirebaseEmailResult> {
  const initResult = ensureFirebaseAdminInitialized();

  if (!initResult.success) {
    return initResult;
  }

  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_DEV_LOG_ONLY === 'true') {
    console.log('[Firebase Email:development] Queued payload (log-only mode):', payload);
    return {
      success: true,
      messageId: `dev-email-log-${Date.now()}`,
    };
  }

  try {
    const db = getFirestore();
    const collectionName = (process.env.FIREBASE_LEADS_EMAIL_COLLECTION || 'mail').trim();

    const docRef = await db.collection(collectionName).add({
      to: [payload.to],
      message: {
        subject: payload.subject,
        text: payload.text,
        ...(payload.html ? { html: payload.html } : {}),
      },
      createdAt: new Date().toISOString(),
      source: 'futurelink-leads',
    });

    return {
      success: true,
      messageId: docRef.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue email in Firebase.',
    };
  }
}
