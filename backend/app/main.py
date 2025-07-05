from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Annotated
import os
from pathlib import Path
import openai

from .item_generator import AssessmentItemGenerator, FACET_ANCHORS
from .validator import StemValidator, DataFrameOutputStrategy
from .models import (
    StemGenerationRequest,
    ValidatedStemItem, OpenAIError,
)
from dotenv import load_dotenv


load_dotenv(Path(__file__).parent.parent / ".env")
openai.api_key = os.getenv("OPENAI_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
   # initialize the transformer within the validator
    StemValidator.get_instance()
    yield
app = FastAPI(title="Stem Generation API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# import pydevd
#
# pydevd.settrace("localhost", 1, 1, 51234)


@app.post("/generate-sample")
async def generate_sample_stems(
    request: StemGenerationRequest,
    validator: Annotated[StemValidator, Depends(StemValidator.get_instance)],
) -> List[ValidatedStemItem]:
    result = AssessmentItemGenerator.generate_items(request)
    if isinstance(result, OpenAIError):
        raise HTTPException(status_code=500, detail=result.msg)
    return validator.validate(
        result,
        request.threshold,
        output_strategy=DataFrameOutputStrategy.to_validated_items_list,
    )


@app.post("/generate")
async def create_stems(
    request: StemGenerationRequest,
    validator: Annotated[StemValidator, Depends(StemValidator.get_instance)],
) -> dict[str, str]:
    output_file = (
        Path(__file__).parent / "data" / request.output_filename
        or "validated_stems.csv"
    )
    validator.validate(
        list(AssessmentItemGenerator.generate_items(request)),
        request.threshold,
        output_strategy=DataFrameOutputStrategy.to_csv(
            (Path(__file__).parent / "data" / request.output_filename).as_posix()
        ),
    )

    return {"status": "success", "output_file": output_file}


@app.get("/facets")
async def get_facets():
    """Get all available facets and their anchors"""
    return [{"facet": k, "anchor": v} for k, v in FACET_ANCHORS.items()]
