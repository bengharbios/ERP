import { GoogleGenAI } from '@google/genai';

export const aiService = {
    async analyzeAssignment(assignment: string, rubric: string, options: any, explicitApiKey?: string) {
        const apiKey = explicitApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `You are an automated Assessor Decision AI analyzing an academic assignment against a grading rubric.

Strict Instructions:
1. ONLY return a JSON object, absolutely NO markdown formatting, NO backticks, NO "json" label, NO introductory or concluding text. The entire response must be parseable by JSON.parse().
2. You MUST evaluate the assignment strictly based on the provided rubric. Do NOT give a default 78%. Calculate the score based on the actual criteria achieved.
3. If the assignment clearly does NOT address the rubric or is entirely off-topic, give it a score of 0 and note this in the improvements.
4. Output all descriptive text in Arabic (e.g., descriptions, strengths, improvements, thinking, integrity). The JSON keys must remain exact strings as specified below in English.

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

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || '';

            // Improved JSON cleaning logic
            let cleanText = text.trim();
            // Remove markdown code blocks
            cleanText = cleanText.replace(/^```(?:json)?\s+/, '').replace(/\s+```$/, '').replace(/^```(?:json)?/, '').replace(/```$/, '');
            cleanText = cleanText.trim();

            try {
                const result = JSON.parse(cleanText);
                return result;
            } catch (parseError: any) {
                console.error("AI Response Parsing Failed. Raw text:", text);
                console.error("Cleaned text:", cleanText);
                throw new Error("Failed to parse AI response as JSON: " + parseError.message);
            }
        } catch (error: any) {
            console.error("AI Analysis Error Details:");
            if (error.status) console.error("Status Code:", error.status);
            if (error.message) console.error("Message:", error.message);
            if (error.response) console.error("Response:", JSON.stringify(error.response, null, 2));
            throw error;
        }
    }
};
