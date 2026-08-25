const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
async function createCheckout({customerEmail, priceId, successUrl, cancelUrl, metadata={}}) {
  if (!stripe) throw new Error('STRIPE_SECRET_KEY is required');
  return stripe.checkout.sessions.create({mode:'subscription',customer_email:customerEmail,line_items:[{price:priceId,quantity:1}],success_url:successUrl,cancel_url:cancelUrl,metadata});
}
function verifyWebhook(rawBody, signature) { if (!stripe) throw new Error('Stripe not configured'); return stripe.webhooks.constructEvent(rawBody,signature,process.env.STRIPE_WEBHOOK_SECRET); }
module.exports={stripe,createCheckout,verifyWebhook};
