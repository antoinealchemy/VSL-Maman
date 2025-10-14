const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// ✅ Désactiver le bodyParser pour Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

// Lire le raw body
function readBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  // ✅ Retourner 405 directement sans redirection
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await readBuffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('✅ PI succeeded', {
          id: pi.id,
          amount: pi.amount,
          metadata: pi.metadata
        });
        // ➜ Fulfillment ici (envoi email, accès produit, etc.)
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const err = pi.last_payment_error;
        console.error('❌ PI failed', {
          id: pi.id,
          amount: pi.amount,
          code: err?.code,
          decline_code: err?.decline_code,
          message: err?.message
        });
        break;
      }
      case 'charge.failed': {
        const charge = event.data.object;
        console.error('❌ Charge failed', {
          id: charge.id,
          outcome: charge.outcome,
          fraud_details: charge.fraud_details
        });
        break;
      }
      case 'payment_intent.processing':
      case 'payment_intent.canceled':
      case 'charge.refunded':
      case 'charge.dispute.created':
        console.log(`ℹ️ ${event.type}`, event.data.object.id);
        break;
      default:
        break;
    }
    
    // ✅ Retourner 200 directement
    return res.status(200).json({ received: true });
    
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Server error');
  }
};