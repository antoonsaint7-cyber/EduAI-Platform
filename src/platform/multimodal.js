const OpenAI=require('openai');
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
async function analyzeImage({imageDataUrl,prompt,context=''}){
  if(!/^data:image\/(png|jpeg|webp|gif);base64,/.test(imageDataUrl||'')) throw new Error('Only base64 image data URLs are accepted');
  const response=await client.responses.create({model:process.env.MULTIMODAL_MODEL||'gpt-5.6-luna',input:[{role:'user',content:[{type:'input_text',text:`${prompt}\n\nCurriculum context:\n${context}`},{type:'input_image',image_url:imageDataUrl}]}]});
  return {text:response.output_text||'',responseId:response.id};
}
module.exports={analyzeImage};
