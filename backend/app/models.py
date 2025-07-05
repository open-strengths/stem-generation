from typing import TypedDict, NewType

from pydantic import BaseModel


class StemGenerationRequest(BaseModel):
    item_number_per_stem: int = 5
    temperature: float = 0.7
    max_tokens: int = 800
    model: str = "gpt-4o"
    constraints: str = ""
    threshold: float = 0.75
    output_filename: str = "validated_stems.csv"


class ValidatedStemItem(BaseModel):
    anchor: str
    facet: str
    stem: str
    cosine_similarity: float
    drift_flag: bool
    length_flag: bool


GeneratedStem = NewType("GeneratedStem", str)


class GeneratedItem(TypedDict):
    facet: str
    anchor: str
    stem: GeneratedStem


class ValidatedStemItemDict:
    facet: str
    anchor: str
    stem_text: str
    cosine_similarity: float
    drift_flag: bool
    length_flag: bool


class OpenAIError(BaseModel):
    msg: str
