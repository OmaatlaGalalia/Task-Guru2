const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);
admin.initializeApp();

// Cloud Function to create a Stripe PaymentIntent
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Authentication check (optional, but recommended)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, currency = 'bwp', taskId } = data;
  if (!amount || !taskId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing amount or taskId');
  }

  try {
    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      metadata: { taskId, userId: context.auth.uid },
    });
    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
