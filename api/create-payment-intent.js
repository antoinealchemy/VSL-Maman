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
    // Récupérer le paramètre includeUpsell depuis le body
    const { includeUpsell } = req.body;
    
    // Prix de base : 17€ (1700 centimes)
    const baseAmount = 1700;
    
    // Prix de l'upsell : 29€ (2900 centimes)
    const upsellAmount = 2900;
    
    // Calculer le montant total
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
        upsellProduct: includeUpsell ? 'Kit Anti-Rechute Complet - 29€' : 'none'
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      includeUpsell: includeUpsell
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};