const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Créer le PaymentIntent avec des paramètres optimisés pour Apple Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1700,
      currency: 'eur',
      automatic_payment_methods: { 
        enabled: true,
        allow_redirects: 'always'
      },
      // Configuration spécifique pour Apple Pay
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      metadata: {
        product: 'Rituel C.A.L.M.E'
      },
      // Important pour Apple Pay
      description: 'Rituel C.A.L.M.E - Programme complet',
      statement_descriptor: 'RITUEL CALME'
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};