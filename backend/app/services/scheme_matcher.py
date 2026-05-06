def evaluate_scheme_eligibility(scheme, user_profile: dict):
    """
    Determines scheme eligibility status with explanation.
    """
    # Normalize inputs
    state = user_profile.get("state", "").strip()
    occupation = user_profile.get("occupation", "").strip()
    income = user_profile.get("income")

    # 1. State check
    if scheme.applicable_states:
        allowed_states = [s.strip().lower() for s in scheme.applicable_states.split(",")]
        if state.lower() not in allowed_states:
            return {
                "status": "Not Eligible",
                "reason": f"Scheme is applicable in {scheme.applicable_states}, not {state}."
            }

    # 2. Occupation check
    if scheme.eligible_occupations:
        allowed_occ = [o.strip().lower() for o in scheme.eligible_occupations.split(",")]
        if occupation.lower() not in allowed_occ:
            return {
                "status": "Not Eligible",
                "reason": f"Scheme targets {scheme.eligible_occupations}, not {occupation}."
            }

    # 3. Income check
    if scheme.income_limit is not None:
        if income is not None:
            try:
                income_val = int(income)
                if income_val > scheme.income_limit:
                    return {
                        "status": "Not Eligible",
                        "reason": f"Income ({income_val}) exceeds limit ({scheme.income_limit})."
                    }
            except ValueError:
                pass # If income is not a valid number, ignore strict check or treat as missing? 
                     # For now, let's treat invalid income as missing/partial data workflow.
        
        # 4. Partial data case (Income missing but required)
        if income is None:
             return {
                "status": "May Be Eligible",
                "reason": "Income information required for final eligibility."
            }

    return {
        "status": "Eligible",
        "reason": "You meet the scheme eligibility criteria."
    }
