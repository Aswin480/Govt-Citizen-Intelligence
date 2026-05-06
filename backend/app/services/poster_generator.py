from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

POSTER_WIDTH = 800
POSTER_HEIGHT = 600
BACKGROUND_COLOR = (255, 255, 255)
TEXT_COLOR = (0, 0, 0)

def generate_policy_poster(
    title: str,
    explanation: dict,
    output_dir: str = "backend/generated_posters"
):
    """
    Generates a neutral, text-based policy poster.
    Returns file path of generated poster.
    """

    os.makedirs(output_dir, exist_ok=True)

    image = Image.new(
        "RGB",
        (POSTER_WIDTH, POSTER_HEIGHT),
        BACKGROUND_COLOR
    )

    draw = ImageDraw.Draw(image)

    try:
        font_title = ImageFont.truetype("arial.ttf", 32)
        font_body = ImageFont.truetype("arial.ttf", 20)
    except IOError:
        # Fallback (portable)
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()

    y = 30

    # Title
    draw.text((40, y), title, fill=TEXT_COLOR, font=font_title)
    y += 60

    # Sections
    for section, text in explanation.items():
        draw.text((40, y), section.replace("_", " ").title(), fill=TEXT_COLOR, font=font_body)
        y += 25
        # Simple text wrapping could be added here, but for now using single line as per 'Simplicity' instruction
        # or relying on short text. For robust wrapping, we'd need a helper. 
        # But I will stick to the user provided code logic which draws directly.
        draw.text((60, y), text, fill=TEXT_COLOR, font=font_body)
        y += 60

    filename = f"policy_poster_{datetime.utcnow().timestamp()}.png"
    filepath = os.path.join(output_dir, filename)

    image.save(filepath)

    return filepath
