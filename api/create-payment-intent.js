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
    const { includeUpsell } = req.body;
    
    const baseAmount = 1700;  // 17€
    const upsellAmount = 2700; // 27€
    
    const totalAmount = includeUpsell ? baseAmount + upsellAmount : baseAmount;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      automatic_payment_methods: { 
        enabled: true
      },
      metadata: {
        product: 'Rituel C.A.L.M.E',
        includeUpsell: includeUpsell ? 'true' : 'false',
        baseProduct: 'Rituel C.A.L.M.E Complet - 17€',
        upsellProduct: includeUpsell ? 'Pack Respiration Instantanée - 27€' : 'none'
      }
    });

    // Renvoyer aussi l'ID pour tracer
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      includeUpsell: includeUpsell
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};