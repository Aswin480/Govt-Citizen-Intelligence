def evaluate_policy_impact(policy, user_profile: dict):
    """
    Rule-based policy impact evaluation.
    Returns impact decision with explanation.
    """
    # Normalize inputs (handle lowercase/uppercase)
    user_state = user_profile.get("state", "").strip()
    user_occupation = user_profile.get("occupation", "").strip()
    
    impact_result = {
        "impact": "YES",
        "reason": "This policy is applicable based on your profile."
    }

    # 1. State Check
    if policy.affected_states and policy.affected_states.lower() != "all":
        # Create a list of allowed states
        allowed_states = [s.strip().lower() for s in policy.affected_states.split(",")]
        
        if user_state.lower() not in allowed_states:
            return {
                "impact": "NO",
                "reason": f"This policy is applicable in {policy.affected_states}, not {user_state}."
            }

    # 2. Target Group Check
    if policy.target_groups and policy.target_groups.lower() != "all":
        allowed_groups = [g.strip().lower() for g in policy.target_groups.split(",")]
        
        if user_occupation.lower() not in allowed_groups:
            return {
                "impact": "NO",
                "reason": f"This policy targets {policy.target_groups}, but you are a {user_occupation}."
            }

    return impact_result
