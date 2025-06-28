import csv
import time
from pathlib import Path
from typing import TypedDict, NewType

import dotenv
import openai


dotenv.find_dotenv(Path(__file__).parent.parent / ".env", raise_error_if_not_found=True)
# loads the OPENAI_API_KEY into the environment from .env file
dotenv.load_dotenv()


GeneratedStem = NewType("GeneratedStem", str)


class GeneratedItem(TypedDict):
    facet: str
    anchor: str
    stem: GeneratedStem


CSV_OUT = Path(__file__).parent.parent / "data" / "ai_stems_generated.csv"
FACET_ANCHORS = {
    "Analytical Reasoning": "I break problems into clear steps.",
    "Systems Perspective": "I see how parts fit a whole.",
    "Foresight": "I anticipate future outcomes.",
    "Curiosity": "I enjoy exploring new ideas.",
    "Reflective Learning": "I think about what I’ve learned.",
    "Sense-Making": "I turn data into clear stories.",
    "Ideation": "I generate many ideas quickly.",
    "Innovation": "I turn ideas into real projects.",
    "Aesthetic Sensitivity": "I notice small design details.",
    "Improvisation": "I adapt when plans change.",
    "Experimentation": "I test ideas to see what works.",
    "Synthesising": "I combine ideas into new concepts.",
    "Achievement Focus": "I aim for challenging goals.",
    "Discipline": "I stick to a task until done.",
    "Adaptable Execution": "I adjust plans when things change.",
    "Resilience": "I bounce back after setbacks.",
    "Initiative": "I act without being told.",
    "Efficiency": "I finish tasks in less time.",
    "Responsibility": "I own the outcomes of my work.",
    "Ethics": "I act according to my values.",
    "Reliability": "I deliver on time consistently.",
    "Patience": "I stay calm when waiting.",
    "Organising": "I keep tasks and data in order.",
    "Safety Orientation": "I take steps to avoid accidents.",
    "Empathy": "I feel others’ emotions.",
    "Social Awareness": "I read social cues accurately.",
    "Collaboration": "I cooperate toward shared goals.",
    "Trust Building": "I earn others’ confidence.",
    "Inclusiveness": "I welcome diverse viewpoints.",
    "Mentorship": "I help others develop skills.",
    "Persuasion": "I can convince others of my ideas.",
    "Storytelling": "I explain ideas through stories.",
    "Confidence": "I project self-assurance.",
    "Energising": "I lift group morale.",
    "Negotiation": "I reach deals that satisfy all sides.",
    "Vision Casting": "I paint a compelling future.",
}


def prompt(anchor: str) -> str:
    return f"""
    Generate 28 questionnaire stems that express the same meaning as:
    "{anchor}"
    
    Each stem must:
    - Be written in the first person
    - Be present-tense, affirmative (no negation)
    - Be ≤15 words
    - Use neutral, CEFR-B1 language
    - Vary in context or wording but keep the core meaning
    - Must not be numbered. e.g the responses.choices[0].message.content should separate each sentence of the response with a newline only, not a numbered list. 
    
    Output each stem as a separate line.
    """


def openai_request(
    prompt: str, model: str, temperature: float = 0.7, max_tokens: int = 800
) -> openai.ChatCompletion:
    return openai.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that writes CEFR-B1 questionnaire items.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )


def openai_response_to_stems(response: openai.ChatCompletion) -> list[GeneratedStem]:
    stems = response.choices[0].message.content.strip().split("\n")
    return [GeneratedStem(s.strip("- ")) for s in stems if s.strip()]


def to_csv(file: str, items: list[GeneratedItem]) -> None:
    if not items:
        return

    fieldnames = items[0].keys()
    with open(file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)


if __name__ == "__main__":
    items: list[GeneratedItem] = []
    for facet, anchor in FACET_ANCHORS.items():
        print(f"Generating stems for: {facet}")
        try:
            response = openai_request(prompt(anchor), "gpt-4o")
            stems = openai_response_to_stems(response)
            for stem in stems:
                items.append({"facet": facet, "anchor": anchor, "stem_text": stem})

        except Exception as e:
            print(f"Error on {facet}: {e}")
            time.sleep(5)

    to_csv(CSV_OUT, items)
    print("✅ Stem generation complete →", CSV_OUT)
