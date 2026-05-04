import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

export const aiService = {
    generatePrompt(assignment: string, rubric: string, options: any) {
        return `You are an automated Assessor Decision AI analyzing an academic assignment against a grading rubric.

Strict Instructions:
1. ONLY return a JSON object, absolutely NO markdown formatting, NO backticks, NO "json" label, NO introductory or concluding text. The entire response must be parseable by JSON.parse().
2. You MUST evaluate the assignment strictly based on the provided rubric. Do NOT give a default 78%. Calculate the score based on the actual criteria achieved.
3. If the assignment clearly does NOT address the rubric or is entirely off-topic, give it a score of 0 and note this in the improvements.
4. Output all descriptive text in ${options.language === 'English' ? 'English' : 'Arabic'} (e.g., descriptions, strengths, improvements, thinking, integrity). The JSON keys must remain exact strings as specified below in English.

Input Data:
--- Assignment ---
${assignment}

--- Rubric ---
${rubric}

--- Settings ---
Evaluation Sensitivity: ${options.evalMode}
Moodle Feedback Enabled: ${options.moodle}
Integrity Review Enabled: ${options.integrity}
Critical Thinking Enabled: ${options.critical}

Analyze the assignment against the rubric and output a JSON object with exactly the following structure:
{
  "score": <number between 0-100>,
  "grade": "<Calculated Grade e.g. Pass/Merit/Distinction/Fail>",
  "criteria": [
    { "id": "Criterion name", "max": 100, "awarded": <number>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "Reasoning in Arabic" }
  ],
  "strengths": ["Strength 1 in Arabic", "Strength 2 in Arabic"],
  "improvements": ["Improvement 1 in Arabic", "Improvement 2 in Arabic"],
  "integrity": "Originality assessment text in Arabic",
  "thinking": "Critical thinking evaluation in Arabic"
}`;
    },

    async analyzeAssignment(assignment: string, rubric: string, options: any, explicitApiKey?: string) {
        const apiKey = explicitApiKey || process.env.GEMINI_API_KEY;
        const prompt = this.generatePrompt(assignment, rubric, options);

        // Detect OpenRouter (Key usually starts with sk-or-)
        if (apiKey && apiKey.startsWith('sk-or-')) {
            return this.analyzeWithOpenRouter(prompt, apiKey);
        }

        if (!apiKey) {
            throw new Error('API key not provided. Please provide a Gemini key or an OpenRouter key (sk-or-...)');
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
            console.error("Gemini AI Error Details:", error.message || error);
            throw error;
        }
    },

    async analyzeWithOpenRouter(prompt: string, apiKey: string) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'z-ai/glm-4.5-air:free',
                messages: [{ role: 'user', content: prompt }],
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
            console.error("OpenRouter AI Error Details:", error.response?.data || error.message);
            throw error;
        }
    },

    parseAIResponse(text: string) {
        let cleanText = text.trim();
        // Remove markdown code blocks if any
        cleanText = cleanText.replace(/^```(?:json)?\s+/, '').replace(/\s+```$/, '').replace(/^```(?:json)?/, '').replace(/```$/, '');
        cleanText = cleanText.trim();

        try {
            return JSON.parse(cleanText);
        } catch (parseError: any) {
            console.error("AI Response Parsing Failed. Raw text:", text);
            throw new Error("Failed to parse AI response as JSON: " + parseError.message);
        }
    }
};
