import { MOCK_BILLS, CONSTITUTION_DATA, LANDMARK_CASES, Article, LandmarkCase } from '../data/constitution';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions for the Trace Result
export interface TraceVerdict {
    billId: string;
    constitutionalMatches: {
        article: Article;
        reason: string;
        riskLevel: 'Safe' | 'Warning' | 'Violation';
        precedents: LandmarkCase[];
    }[];
    socioEconomicImpact: {
        winner: string;
        loser: string;
        description: string;
    };
    jurisdictionCheck: {
        status: 'Valid' | 'Overreach';
        message: string;
    };
    protestPrediction: {
        level: 'Low' | 'Medium' | 'High' | 'Severe';
        group: string;
    };
}

export class ConstitutionalEngine {

    public static traceBill(billId: string, customBill?: any): TraceVerdict | null {
        let bill = MOCK_BILLS.find(b => b.id === billId);
        
        // Fallback to custom bill data if provided (for real bills from backend)
        if (!bill && customBill) {
            bill = {
                id: customBill.id || billId,
                title: customBill.bill_name || customBill.title,
                description: customBill.description || `Legislative bill regarding ${customBill.bill_name}`,
                sector: customBill.ministry_name || "General",
                tags: this.extractTags(customBill.bill_name || ""),
                impact_analysis: { rich: "Unknown", middle: "Unknown", poor: "Unknown" },
                protest_risk: "Medium"
            };
        }

        if (!bill) return null;

        const matches: TraceVerdict['constitutionalMatches'] = [];

        // 1. Tag Matching Logic (The "Brain")
        bill.tags.forEach(tag => {
            CONSTITUTION_DATA.forEach(article => {
                if (article.keywords.includes(tag)) {
                    // Logic: Determine risk based on keywords
                    let risk: 'Safe' | 'Warning' | 'Violation' = 'Safe';

                    if (tag === 'privacy' || tag === 'surveillance') risk = 'Warning';
                    if (tag === 'state_subject' && bill!.sector !== 'Defense') risk = 'Violation'; 

                    // Fetch precedents
                    const precedents = article.landmark_cases
                        .map(id => LANDMARK_CASES[id])
                        .filter(c => c !== undefined);

                    matches.push({
                        article: article,
                        reason: `Matched on keyword: '${tag}'`,
                        riskLevel: risk,
                        precedents: precedents
                    });
                }
            });
        });

        // 2. Jurisdiction Logic (Schedule 7 Check)
        let jurisdiction: TraceVerdict['jurisdictionCheck'] = { status: 'Valid', message: 'Legislation falls under Center/Concurrent List.' };
        if (bill.tags.includes('agriculture') || bill.tags.includes('health')) {
            jurisdiction = {
                status: 'Overreach',
                message: 'Federal Warning: This sector is primarily a State Subject (Schedule 7).'
            };
        }

        // 3. Socio-Economic Logic
        let winner = 'Unknown';
        let loser = 'Unknown';
        if (bill.impact_analysis.rich?.includes('Positive')) winner = 'Corporate / Wealthy';
        if (bill.impact_analysis.middle?.includes('Positive')) winner = 'Middle Class';
        if (bill.impact_analysis.poor?.includes('Negative')) loser = 'Low Income / Rural';
        
        // Extra heuristic for common bill terms
        if (bill.title.toLowerCase().includes('corporate')) winner = 'Large Business';
        if (bill.title.toLowerCase().includes('welfare')) winner = 'Underprivileged';

        return {
            billId: bill.id,
            constitutionalMatches: matches,
            socioEconomicImpact: {
                winner,
                loser,
                description: winner !== 'Unknown' ? `Analysis suggests benefits for ${winner}.` : "Impact analysis requires more detailed text."
            },
            jurisdictionCheck: jurisdiction,
            protestPrediction: {
                level: bill.protest_risk.split(' ')[0] as any,
                group: bill.protest_risk
            }
        };
    }

    private static extractTags(text: string): string[] {
        const tags: string[] = [];
        const lower = text.toLowerCase();
        if (lower.includes('constitution')) tags.push('equality');
        if (lower.includes('health')) tags.push('health');
        if (lower.includes('agriculture') || lower.includes('farm')) tags.push('agriculture');
        if (lower.includes('privacy') || lower.includes('data')) tags.push('privacy');
        if (lower.includes('speech') || lower.includes('media')) tags.push('speech');
        if (lower.includes('religion')) tags.push('religion');
        return tags;
    }

    public static async evaluateWithGemini(apiKey: string, textToEvaluate: string, modelName: string = "gemini-1.5-flash"): Promise<TraceVerdict> {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const CONSTITUTION_CONTEXT = JSON.stringify(CONSTITUTION_DATA);

            const prompt = `You are a Constitutional Expert AI for the Indian Government.
Your task is to analyze the following policy/bill text and evaluate its constitutionality, socio-economic impact, jurisdiction (Schedule 7), and protest risks.
Here is the Constitution Knowledge Base:
${CONSTITUTION_CONTEXT}

Policy Text to Evaluate:
"""
${textToEvaluate}
"""

Return ONLY a valid JSON object exactly matching this structure (no markdown tags, no extra text):
{
    "billId": "custom_gemini_eval",
    "constitutionalMatches": [
        {
            "article": { "id": "Art X", "title": "...", "description": "...", "keywords": [] },
            "reason": "Explain why this article matches",
            "riskLevel": "Safe" | "Warning" | "Violation",
            "precedents": []
        }
    ],
    "socioEconomicImpact": {
        "winner": "...",
        "loser": "...",
        "description": "..."
    },
    "jurisdictionCheck": {
        "status": "Valid" | "Overreach",
        "message": "..."
    },
    "protestPrediction": {
        "level": "Low" | "Medium" | "High" | "Severe",
        "group": "..."
    }
}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Try to extract JSON from markdown if Gemini included it
            let finalJsonString = responseText;
            if (responseText.includes("\`\`\`json")) {
                const parts = responseText.split("\`\`\`json");
                finalJsonString = parts[1].split("\`\`\`")[0].trim();
            } else if (responseText.includes("\`\`\`")) {
                const parts = responseText.split("\`\`\`");
                finalJsonString = parts[1].trim();
            }

            const parsedVerdict = JSON.parse(finalJsonString) as TraceVerdict;
            return parsedVerdict;

        } catch (error) {
            console.error("Gemini Evaluation Failed", error);
            throw error;
        }
    }
}
