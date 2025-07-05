from pathlib import Path
from typing import Optional, TypeVar, Callable

import polars as pl
from pydantic import TypeAdapter
from sentence_transformers import SentenceTransformer, util

from .models import GeneratedItem, ValidatedStemItem


class DataFrameOutputStrategy:
    @staticmethod
    def to_validated_items_list(validated_df: pl.DataFrame) -> list[ValidatedStemItem]:
        data = validated_df.to_dicts()
        print(data)
        return TypeAdapter(list[ValidatedStemItem]).validate_python(
            data
        )

    @staticmethod
    def to_csv(filename: Path) -> Callable[[pl.DataFrame], None]:
        def _to_csv(df: pl.DataFrame) -> None:
            df.to_pandas().to_csv(filename)

        return _to_csv


T = TypeVar("T")


class StemValidator:
    _instance: Optional["StemValidator"] = None

    def __init__(self, transformer: SentenceTransformer):
        """Initialize the validator with a pre-trained sentence transformer model."""
        self.transformer = transformer

    @classmethod
    def get_instance(cls) -> "StemValidator":
        if cls._instance is None:
            cls._instance = StemValidator(SentenceTransformer("all-mpnet-base-v2"))
        return cls._instance

    def validate(
        self,
        items: list[GeneratedItem],
        threshold: float,
        output_strategy: Callable[[pl.DataFrame], T],
    ) -> T:
        data = pl.DataFrame(items)
        stem_embeddings = self.transformer.encode(
            data["stem"].to_numpy(), convert_to_tensor=True
        )
        anchor_embeddings = self.transformer.encode(
            data["anchor"].to_numpy(), convert_to_tensor=True
        )
        cosine_similarites = util.pairwise_cos_sim(stem_embeddings, anchor_embeddings)

        data_with_cos_sim = data.with_columns(
            pl.Series(name="cosine_similarity", values=cosine_similarites.cpu().numpy())
        )

        return output_strategy(data_with_cos_sim.with_columns(
            (pl.col("cosine_similarity") < threshold).cast(pl.Int8).alias("drift_flag"),
            (pl.col("stem").str.split(" ").list.len() > 15)
            .cast(pl.Int8)
            .alias("length_flag"),
        ))
