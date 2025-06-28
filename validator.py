import polars as pl
from sentence_transformers import SentenceTransformer, util

from anchors import FACET_ANCHORS

FILE = "ai_stems_generated.csv"
THRESHOLD = 0.75
MODELS = ["all-MiniLM-L6-v2", "all-mpnet-base-v2"]

if __name__ == "__main__":
    for model in MODELS:
        print(f"▶ Loading model ({model})…")
        transformer_model = SentenceTransformer(model)
        data = pl.read_csv(FILE).with_columns(
            pl.col("facet")
            .map_batches(lambda fs: fs.replace_strict(FACET_ANCHORS))
            .alias("anchor")
        )
        stem_embeddings = transformer_model.encode(
            data["stem_text"].to_numpy(), convert_to_tensor=True
        )
        anchor_embeddings = transformer_model.encode(
            data["anchor"].to_numpy(), convert_to_tensor=True
        )
        cosine_similarites = util.pairwise_cos_sim(stem_embeddings, anchor_embeddings)

        data_with_cos_sim = data.with_columns(
            pl.Series(name="cosine_similarity", values=cosine_similarites.cpu().numpy())
        )

        data_with_cos_sim.with_columns(
            (pl.col("cosine_similarity") < THRESHOLD).cast(pl.Int8).alias("drift_flag"),
            (pl.col("stem_text").str.split(" ").list.len() > 15)
            .cast(pl.Int8)
            .alias("length_flag"),
        ).to_pandas().to_csv(f"ai_stems_with_sims-{model}.csv")
