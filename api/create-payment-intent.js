const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // ✅ Version fixe pour éviter les surprises
});

module.exports = async (req, res) => {
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
    const { includeUpsell, paymentIntentId } = req.body;

    const baseAmount = 100;   // Vos montants de test (1€)
    const upsellAmount = 100; // 1€
    const totalAmount = includeUpsell ? baseAmount + upsellAmount : baseAmount;

    let paymentIntent;

    if (paymentIntentId) {
      // ✅ Mise à jour du PaymentIntent existant
      console.log('🔄 Mise à jour du PaymentIntent:', paymentIntentId);
      paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
        amount: totalAmount,
        statement_descriptor_suffix: 'RITUEL CALME', // ✅ Max 22 chars
        payment_method_options: {
          card: { 
            request_three_d_secure: includeUpsell ? 'any' : 'automatic' // ✅ Force 3DS
          }
        },
        metadata: {
          product: 'Rituel C.A.L.M.E',
          includeUpsell: includeUpsell ? 'true' : 'false',
          baseProduct: 'Rituel C.A.L.M.E Complet',
          upsellProduct: includeUpsell ? 'Pack Respiration Instantanée' : 'none'
        }
      });
    } else {
      // ✅ Création d'un nouveau PaymentIntent
      console.log('✨ Création d\'un nouveau PaymentIntent');
      paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'eur',
        automatic_payment_methods: { 
          enabled: true,
          allow_redirects: 'always' 
        },
        description: 'Rituel C.A.L.M.E - Programme complet',
        statement_descriptor_suffix: 'RITUEL CALME', // ✅ Max 22 chars
        payment_method_options: {
          card: { 
            request_three_d_secure: includeUpsell ? 'any' : 'automatic' // ✅ Force 3DS
          }
        },
        metadata: {
          product: 'Rituel C.A.L.M.E',
          includeUpsell: includeUpsell ? 'true' : 'false',
          baseProduct: 'Rituel C.A.L.M.E Complet',
          upsellProduct: includeUpsell ? 'Pack Respiration Instantanée' : 'none'
        }
      });
    }

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      includeUpsell: includeUpsell
    });

  } catch (error) {
    console.error('❌ Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
};