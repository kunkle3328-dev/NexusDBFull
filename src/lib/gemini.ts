import { GoogleGenAI, Type, ThinkingLevel, Modality } from '@google/genai';
import { Source, ChatMessage } from './db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeSource(content: string, mimeType: string, isUrl: boolean = false) {
  const prompt = `Analyze the following content and provide a concise title, summary, a category, and up to 5 relevant tags.`;
  
  if (isUrl) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${prompt} Return ONLY a valid JSON object with keys: "title" (string), "summary" (string), "category" (string), "tags" (array of strings). Do not include any markdown formatting or code blocks.\n\nURL to analyze: ${content}`,
        config: {
          tools: [{ urlContext: {} }]
        }
      });
      
      let text = response.text || '{}';
      // Clean up potential markdown formatting
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse URL analysis response', e);
      return { title: 'Unknown Web Page', summary: 'Analysis failed. Could not read URL or extract content.', category: 'Web Link', tags: ['url', 'unparsed'] };
    }
  }

  const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
  
  if (mimeType && content.length > 0) {
    contents[0].parts.push({ inlineData: { data: content, mimeType } });
  } else {
    contents[0].parts.push({ text: content });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'summary', 'category', 'tags']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error('Failed to parse analysis response', e);
    return { title: 'Unknown Source', summary: 'Analysis failed', category: 'Uncategorized', tags: [] };
  }
}

export async function chatWithSources(
  messages: ChatMessage[], 
  sources: Source[], 
  useDeepThinking: boolean, 
  useSearch: boolean,
  useLocalFast: boolean
) {
  const urls = sources.filter(s => s.type === 'link' && s.url).map(s => s.url!);
  const fileParts = sources.filter(s => s.type === 'document' && s.fileData).map(s => ({
    inlineData: { data: s.fileData!, mimeType: s.mimeType! }
  }));
  const textParts = sources.filter(s => s.type === 'document' && s.content && !s.fileData).map(s => ({
    text: `Document: ${s.name}\n${s.content}`
  }));

  let model = useLocalFast 
    ? 'gemini-3.1-flash-lite-preview' 
    : (useSearch || urls.length > 0 ? 'gemini-3-flash-preview' : 'gemini-3.1-pro-preview');

  // If we are using deep thinking, we MUST use pro-preview
  if (useDeepThinking) {
    model = 'gemini-3.1-pro-preview';
  }

  const config: any = {
    systemInstruction: `You are an advanced AI research assistant. Use the provided sources to answer the user's queries accurately. If the answer is not in the sources, say so, unless you are instructed to use general knowledge or search.`,
  };

  if (useDeepThinking && model === 'gemini-3.1-pro-preview') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const tools: any[] = [];
  if (useSearch && (model === 'gemini-3-flash-preview' || model === 'gemini-3.1-pro-preview')) {
    tools.push({ googleSearch: {} });
  }
  
  // urlContext is only available for gemini-3-flash-preview
  if (urls.length > 0 && model === 'gemini-3-flash-preview') {
    tools.push({ urlContext: {} });
  }
  
  if (tools.length > 0) {
    config.tools = tools;
  }

  const contents: any[] = [];
  
  // Add context as the first user message
  const contextParts: any[] = [...fileParts, ...textParts];
  if (urls.length > 0) {
    contextParts.push({ text: `Please also consider these URLs for context: ${urls.join(', ')}` });
  }

  if (contextParts.length > 0) {
    contents.push({ role: 'user', parts: [{ text: 'Here are my research sources:' }, ...contextParts] });
    contents.push({ role: 'model', parts: [{ text: 'I have reviewed your sources. How can I help you?' }] });
  }

  contents.push(...messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  })));

  return await ai.models.generateContentStream({
    model,
    contents,
    config
  });
}

export async function generateTTS(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error('TTS generation failed', e);
    return null;
  }
}
