const BASE_URL = "http://127.0.0.1:8001"; // Using port 8001

export async function evaluatePolicy(
    policyId: number,
    userProfile: {
        state: string;
        occupation: string;
    }
) {
    // Note: The backend endpoint /policies/evaluate expects:
    // Body: { "policy_id": int, "user_profile": {...} }
    // User prompt code suggests URL param ?policy_id=... but body for profile.
    // I need to check `backend/app/api/policies.py` to confirm the exact schema implemented in Step 11.
    // Step 11 code:
    // class PolicyEvaluationRequest(BaseModel):
    //     policy_id: int
    //     user_profile: dict
    // @router.post("/evaluate")
    // def evaluate_policy_impact(request: PolicyEvaluationRequest, db...):

    // So the backend expects a JSON BODY with both policy_id and user_profile.
    // The user's prompt code here is slightly different from the backend implementation I did.
    // I will adapt the frontend code to match my actual backend implementation to ensure it works.

    const response = await fetch(
        `${BASE_URL}/policies/evaluate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                policy_id: policyId,
                user_profile: userProfile,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to evaluate policy");
    }

    return response.json();
}

export async function evaluateScheme(
    schemeId: number,
    userProfile: {
        state: string;
        occupation: string;
        income?: number;
    }
) {
    const response = await fetch(
        `${BASE_URL}/schemes/evaluate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                scheme_id: schemeId,
                user_profile: userProfile,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to evaluate scheme");
    }

    return response.json();
}

/**
 * Utility to poll an action periodically.
 * @param fn The async function to execute
 * @param interval MS between calls
 */
export function pollEvery(fn: () => void, interval = 10000) {
    const intervalId = setInterval(fn, interval);
    return () => clearInterval(intervalId); // Return cleanup function
}
