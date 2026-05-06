import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

export const aiService = {
    generatePrompt(assignment: string, rubric: string, options: any) {
        const isArabic = options.language !== 'English';
        
        if (isArabic) {
            return `أنت مقيم أكاديمي ذكي متخصص في تحليل الواجبات الدراسية بناءً على معايير التصحيح (Rubric).
            
تعليمات صارمة:
1. يجب أن تكون جميع النصوص الوصفية (الشرح، نقاط القوة، التحسينات، التقييم النقدي، والنزاهة) باللغة العربية الفصحى والاحترافية.
2. يجب أن تكون قيم "status" هي (Achieved) أو (Not Achieved).
3. يجب أن تكون قيم "depth" هي (Analytical) أو (Descriptive).
4. يجب أن تكون قيمة "grade" حصرياً أحد المصطلحات الإنجليزية التالية: (Pass, Merit, Distinction, Fail).
5. أجب فقط بصيغة JSON، بدون أي نصوص إضافية أو علامات ماركداون.

البيانات:
--- الواجب ---
${assignment}

--- المعايير ---
${rubric}

--- الإعدادات ---
حساسية التقييم: ${options.evalMode}

قم بتحليل الواجب وإخراج JSON بهذا الهيكل تماماً:
{
  "score": <رقم بين 0-100>,
  "grade": "Pass / Merit / Distinction / Fail",
  "criteria": [
    { "id": "اسم المعيار", "max": 100, "awarded": <رقم>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "شرح الأسباب بالعربي" }
  ],
  "strengths": ["نقطة قوة 1 بالعربي", "نقطة قوة 2 بالعربي"],
  "improvements": ["نقطة تحسين 1 بالعربي", "نقطة تحسين 2 بالعربي"],
  "integrity": "تقييم النزاهة بالعربي",
  "thinking": "تقييم التفكير النقدي بالعربي"
}`;
        }

        return `You are an automated Assessor Decision AI analyzing an academic assignment against a grading rubric.

Strict Instructions:
1. ONLY return a JSON object, absolutely NO markdown formatting.
2. Output all descriptive text ONLY in English.
3. values for "status" must be (Achieved/Not Achieved) and "depth" must be (Analytical/Descriptive).
4. Output only JSON.

Input Data:
--- Assignment ---
${assignment}

--- Rubric ---
${rubric}

Analyze and output JSON:
{
  "score": <number>,
  "grade": "<Pass/Merit/Distinction/Fail>",
  "criteria": [
    { "id": "Criterion name", "max": 100, "awarded": <number>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "Reasoning in English" }
  ],
  "strengths": ["Strength 1"],
  "improvements": ["Improvement 1"],
  "integrity": "Integrity assessment",
  "thinking": "Critical thinking evaluation"
}`;
    },

    async analyzeAssignment(assignment: string, rubric: string, options: any, explicitApiKey?: string) {
        const apiKey = explicitApiKey || process.env.GEMINI_API_KEY;
        const prompt = this.generatePrompt(assignment, rubric, options);

        if (apiKey && apiKey.startsWith('sk-or-')) {
            return this.analyzeWithOpenRouter(prompt, apiKey);
        }

        if (!apiKey) {
            throw new Error('API key not provided');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || '';
            return this.parseAIResponse(text);
        } catch (error: any) {
            console.error("Gemini AI Error:", error.message);
            throw error;
        }
    },

    async analyzeWithOpenRouter(prompt: string, apiKey: string) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'z-ai/glm-4.5-air:free',
                messages: [{ role: 'system', content: 'You are a professional academic assessor that performs deep reasoning before outputting structured JSON.' }, { role: 'user', content: prompt }],
                provider: {
                    reasoning_enabled: true
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://erp-xi-lac.vercel.app',
                    'X-Title': 'OSARAB ERP'
                }
            });

            const text = response.data.choices[0].message.content;
            return this.parseAIResponse(text);
        } catch (error: any) {
            console.error("OpenRouter AI Error:", error.response?.data || error.message);
            throw error;
        }
    },

    parseAIResponse(text: string) {
        let cleanText = text.trim();
        cleanText = cleanText.replace(/^```(?:json)?\s+/, '').replace(/\s+```$/, '').replace(/^```(?:json)?/, '').replace(/```$/, '');
        cleanText = cleanText.trim();

        try {
            return JSON.parse(cleanText);
        } catch (parseError: any) {
            console.error("AI Response Parsing Failed. Raw text:", text);
            throw new Error("Failed to parse AI response as JSON");
        }
    }
};
