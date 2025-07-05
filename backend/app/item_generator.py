from typing import ClassVar, Iterable

import openai

from .models import (
    StemGenerationRequest,
    GeneratedStem,
    GeneratedItem,
    OpenAIError,
)
from loguru import logger

FACET_ANCHORS = {
    "Analytical Reasoning": "I break problems into clear steps.",
    "Systems Perspective": "I see how parts fit a whole.",
    "Foresight": "I anticipate future outcomes.",
    "Curiosity": "I enjoy exploring new ideas.",
    "Reflective Learning": "I think about what I've learned.",
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
    "Empathy": "I feel others' emotions.",
    "Social Awareness": "I read social cues accurately.",
    "Collaboration": "I cooperate toward shared goals.",
    "Trust Building": "I earn others' confidence.",
    "Inclusiveness": "I welcome diverse viewpoints.",
    "Mentorship": "I help others develop skills.",
    "Persuasion": "I can convince others of my ideas.",
    "Storytelling": "I explain ideas through stories.",
    "Confidence": "I project self-assurance.",
    "Energising": "I lift group morale.",
    "Negotiation": "I reach deals that satisfy all sides.",
    "Vision Casting": "I paint a compelling future.",
}


class AssessmentItemGenerator:
    BASE_PROMPT_CONSTRAINTS: ClassVar[str] = """- Be written in the first person
           - Be present-tense, affirmative (no negation)
           - Be ≤15 words
           - Use neutral, CEFR-B1 language
           - Vary in context or wording but keep the core meaning
           - Do not number each stem. Delimit only by newlines
           """

    @classmethod
    def constraints(cls, additional_constraints: str):
        return (
            f"{cls.BASE_PROMPT_CONSTRAINTS}"
            if not additional_constraints
            else f"{cls.BASE_PROMPT_CONSTRAINTS}\n{additional_constraints}"
        )

    @classmethod
    def prompt(cls, anchor: str, request: StemGenerationRequest) -> str:
        return f"""
            Generate {request.item_number_per_stem} questionnaire stems that express the same meaning as:
            "{anchor}"
            Each stem must:
            {cls.constraints(request.constraints)}
            Output each stem as a separate line.
        """

    @staticmethod
    def parse_stems(response: openai.ChatCompletion) -> list[GeneratedStem]:
        response_content = response.choices[0].message.content.strip()
        return [
            GeneratedStem(s.strip("- "))
            for s in response_content.split("\n")
            if s.strip()
        ]

    @staticmethod
    def create_chat_completion(
        model: str, messages: list[dict[str, str]], temperature: float, max_tokens: int
    ) -> openai.ChatCompletion:
        try:
            return openai.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as e:
            return OpenAIError(msg=str(e))

    @classmethod
    def generate_items(cls, request: StemGenerationRequest) -> list[GeneratedItem] | OpenAIError:
        items: list[GeneratedItem] = []
        for anchor, facet in FACET_ANCHORS.items():
            messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that writes CEFR-B1 questionnaire items.",
                    },
                    {"role": "user", "content": cls.prompt(anchor, request)},
                ]
            response = cls.create_chat_completion(
                request.model, messages, request.temperature, request.max_tokens
            )
            match response:
                case OpenAIError(msg=msg):
                    logger.warning(f"OpenAI raised an Error: {msg}")
                    return response
                case _ as resp:
                    for stem in cls.parse_stems(resp):
                        items.append({
                            "facet": facet,
                            "anchor": anchor,
                            "stem": stem,
                        })
        return items
