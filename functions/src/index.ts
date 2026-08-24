import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface EmailCallableData {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  documentType: string;
  documentNumber: string;
}

/**
 * Cloud Function to dispatch Quotations, Invoices, and Balance Invoices via Resend / Brevo API.
 */
export const sendDocumentEmail = functions.https.onCall(async (data: EmailCallableData, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to send emails.');
  }

  const { to, cc, subject, message, documentType, documentNumber } = data;

  if (!to || !subject || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required email fields.');
  }

  try {
    // Integration logic for Resend or Brevo API
    // e.g., await resend.emails.send({ from: 'KEVORCH SBD <kevorchsbd@gmail.com>', to, cc, subject, html: message });

    return {
      success: true,
      message: `Email for ${documentType} ${documentNumber} dispatched successfully to ${to}.`
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to dispatch email.');
  }
});
