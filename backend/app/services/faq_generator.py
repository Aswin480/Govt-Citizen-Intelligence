def explain_before_react(policy_title: str, policy_description: str):
    """
    Generates a neutral, structured explanation
    before showing summaries or posters.
    """
    return {
        "what_happened": f"The policy titled '{policy_title}' was discussed or introduced.",
        "why_it_matters": (
            "This policy may influence public services, regulations, or benefits "
            "depending on implementation and eligibility."
        ),
        "what_it_does_not_mean": (
            "This does not automatically mean immediate changes, "
            "nor does it guarantee benefits without official verification."
        )
    }

def generate_citizen_faqs():
    """
    Generates standard citizen questions
    applicable to most policies.
    """
    return [
        "Will this policy affect me directly?",
        "Who are the primary beneficiaries?",
        "When will this policy be implemented?",
        "Is this policy permanent or temporary?",
        "Do I need to apply to receive benefits?",
        "What official source confirms this information?"
    ]
