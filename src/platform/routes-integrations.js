const crypto=require('node:crypto');
const {verifySignedWebhook,createCheckout}=require('./payments');
const {sendEmail,verificationEmail,passwordResetEmail}=require('./email');
const {verifyTotp}=require('./mfa');
const {createRealtimeClientSecret}=require('./realtime');
const {analyzeImage}=require('./multimodal');

function hashToken(token){return crypto.createHash('sha256').update(token).digest('hex');}
function makeToken(){return crypto.randomBytes(32).toString('hex');}
function issueToken(){const token=makeToken();return {token,tokenHash:hashToken(token)};}

async function createVerification({email,baseUrl}){const {token,tokenHash}=issueToken();const message=verificationEmail(`${baseUrl}/verify-email?token=${token}`);await sendEmail({to:email,...message});return {tokenHash};}
async function createPasswordReset({email,baseUrl}){const {token,tokenHash}=issueToken();const message=passwordResetEmail(`${baseUrl}/reset-password?token=${token}`);await sendEmail({to:email,...message});return {tokenHash};}

function handlePaymentWebhook({rawBody,signature}){if(!verifySignedWebhook(rawBody,signature,process.env.PAYMENT_WEBHOOK_SECRET))throw new Error('Invalid payment signature');return JSON.parse(rawBody);}
function verifyMfa({secret,token}){return verifyTotp(secret,token);}
module.exports={createCheckout,createVerification,createPasswordReset,handlePaymentWebhook,verifyMfa,createRealtimeClientSecret,analyzeImage,hashToken};
