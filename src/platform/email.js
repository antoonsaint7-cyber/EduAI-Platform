async function sendEmail({to,subject,html,text}){
  if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM) throw new Error('Email provider is not configured');
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,html,text})});
  if(!r.ok) throw new Error(`Email provider error: ${r.status}`); return r.json();
}
function verificationEmail(url){return {subject:'Verify your account',text:`Verify your account: ${url}`,html:`<p>Verify your account</p><p><a href="${url}">Verify email</a></p>`};}
function passwordResetEmail(url){return {subject:'Reset your password',text:`Reset your password: ${url}`,html:`<p>Reset your password</p><p><a href="${url}">Reset password</a></p>`};}
module.exports={sendEmail,verificationEmail,passwordResetEmail};
