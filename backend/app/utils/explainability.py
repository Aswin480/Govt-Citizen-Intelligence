def explain_sentiment(label: str, score: float, aspect: list[str]) -> str:
    """
    Generates a neutral, human-readable explanation for sentiment predictions.
    """
    aspect_text = ", ".join(aspect)
    label_clean = label.lower()

    # Rule-Based Logic for Safety
    if "positive" in label_clean:
        return (
            f"The statement expresses a generally supportive tone towards "
            f"the topic(s): {aspect_text}. "
            f"This is based on language indicating approval, benefit, or successful implementation."
        )

    if "negative" in label_clean:
        return (
            f"The statement expresses concerns or criticism regarding "
            f"the topic(s): {aspect_text}. "
            f"This is based on language highlighting problems, risks, or failures."
        )

    return (
        f"The statement shows a neutral or mixed stance towards "
        f"the topic(s): {aspect_text}, focusing on factual details without strong emotional indicators."
    )
