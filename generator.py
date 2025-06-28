# stem_generator_openai.py
# Generates ~28 stems per facet using OpenAI GPT API and audits for drift
import os

import openai
import csv
import time

from anchors import FACET_ANCHORS

openai.api_key = os.getenv("OPEN_AI_API_KEY")

# Save output to this CSV
CSV_OUT = "ai_stems_generated.csv"
if __name__ == "__main__":
    with open(CSV_OUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["facet", "stem_text", "drift_flag", "readability_flag", "length_flag"],
        )

        for facet, anchor in FACET_ANCHORS.items():
            print(f"Generating stems for: {facet}")
            prompt = f"""
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

            try:
                response = openai.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that writes CEFR-B1 questionnaire items.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    max_tokens=800,
                )

                stems = response.choices[0].message.content.strip().split("\n")

                stems = [s.strip("- ") for s in stems if s.strip()]

                for stem in stems:
                    writer.writerow([facet, stem, 0, 0, 0])

            except Exception as e:
                print(f"Error on {facet}: {e}")
                time.sleep(5)  # retry delay
    print("✅ Stem generation complete →", CSV_OUT)
