const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// utilitaire pour lire le raw body (obligatoire pour vérifier la signature)
function readBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  let event;
  const sig = req.headers['stripe-signature'];
  const buf = await readBuffer(req);

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // tu vas le définir dans Vercel après création du webhook
    );
  } catch (err) {
    console.error('❌ Signature invalide:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('✅ PI succeeded', pi.id, pi.amount, pi.metadata);
        // ➜ Fulfillment ici (donner l’accès, e-mail, etc.)
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const e = pi.last_payment_error;
        console.error('❌ PI failed', {
          pi: pi.id,
          type: e?.type,
          code: e?.code,
          decline_code: e?.decline_code,
          message: e?.message,
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
        // ignore les autres
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    res.status(500).send('Server error');
  }
};
