from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pandas as pd


FINISH_LEVELS = ("simple", "standard", "complex")
INTERTENANCY_WALL = ("yes", "no")
COMPONENTS = ("fixing", "stopping", "square_stop", "corner", "paint", "render")
MIN_SAMPLES_FOR_FACTOR_RECOMMENDATION = 8


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calibrate estimate parameters from historical projects.")
    parser.add_argument("--projects", required=True, help="Path to projects CSV file.")
    parser.add_argument("--config", required=True, help="Path to current config JSON file.")
    parser.add_argument("--output", required=True, help="Directory for output reports.")
    return parser.parse_args()


def load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, payload: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)


def floor_area_band(value: float) -> str:
    if value < 100:
        return "<100"
    if value < 150:
        return "100-149"
    if value < 200:
        return "150-199"
    return "200+"


def clean_optional_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    for column in result.columns:
        if column.startswith("actual_") or column in {"floor_area", "render_area"}:
            result[column] = pd.to_numeric(result[column], errors="coerce")
    return result


def is_included(value: Any) -> bool:
    if pd.isna(value):
        return True
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() not in {"no", "false", "0", "exclude"}


def calculate_estimates(df: pd.DataFrame, config: dict[str, Any]) -> pd.DataFrame:
    result = clean_optional_numeric_columns(df)
    result["render_area"] = result.get("render_area", 0).fillna(0)
    result["wall_factor"] = result["finish_level"].map(config["wallFactor"])
    result["paint_factor"] = result["finish_level"].map(config["paintFactor"])

    result["estimated_wall_area"] = result["floor_area"] * result["wall_factor"]
    result["estimated_ceiling_area"] = result["floor_area"]
    result["estimated_fixing_area"] = result["estimated_wall_area"]
    intertenancy_mask = result["intertenancy_wall"] == "yes"
    result.loc[intertenancy_mask, "estimated_fixing_area"] = (
        result.loc[intertenancy_mask, "estimated_wall_area"]
        * config["fixing"]["intertenancy_multiplier"]
    )
    result["estimated_stopping_area"] = result["estimated_wall_area"]
    result["estimated_square_stop_length"] = (
        result["floor_area"] * config["stoppingBreakdown"]["square_stop_factor"]
    )
    result["estimated_external_corner_length"] = (
        result["floor_area"] * config["stoppingBreakdown"]["external_corner_factor"]
    )
    result["estimated_paint_area"] = (
        result["estimated_wall_area"] + result["estimated_ceiling_area"]
    ) * result["paint_factor"]

    result["external_corner_type"] = result.get(
        "external_corner_type",
        config["externalCorner"]["default_type"],
    ).fillna(config["externalCorner"]["default_type"])
    result["corner_rate"] = config["rates"]["corner_rate"]
    result.loc[result["external_corner_type"] == "premium", "corner_rate"] += config["externalCorner"][
        "premium_add_rate"
    ]

    model = config.get("model", {})
    finish_multipliers = model.get("finishMultipliers", {})
    area_bands = model.get("areaBands", [])
    minimums = model.get("minimums", {})

    def area_band_for(floor_area: float) -> dict[str, Any]:
        for band in area_bands:
            max_floor_area = band.get("max_floor_area")
            if max_floor_area is None or floor_area <= max_floor_area:
                return band
        return area_bands[-1] if area_bands else {}

    def multiplier(row: pd.Series, key: str) -> float:
        finish_value = finish_multipliers.get(row["finish_level"], {}).get(key, 1)
        band_value = area_band_for(row["floor_area"]).get(key, 1)
        return float(finish_value) * float(band_value)

    def apply_minimum(amount: float, key: str) -> float:
        if amount <= 0:
            return 0
        return max(amount, float(minimums.get(key, 0)))

    result["estimated_fixing_mid"] = result.apply(
        lambda row: apply_minimum(
            row["estimated_fixing_area"] * config["rates"]["fixing_rate"] * multiplier(row, "fixing"),
            "fixing",
        ),
        axis=1,
    )
    result["estimated_stopping_mid"] = result.apply(
        lambda row: apply_minimum(
            row["estimated_stopping_area"] * config["rates"]["stopping_rate"] * multiplier(row, "stopping"),
            "stopping",
        ),
        axis=1,
    )
    result["estimated_square_stop_mid"] = result.apply(
        lambda row: apply_minimum(
            row["estimated_square_stop_length"]
            * config["rates"]["square_stop_rate"]
            * multiplier(row, "squareStop"),
            "squareStop",
        ),
        axis=1,
    )
    result["estimated_corner_mid"] = result.apply(
        lambda row: apply_minimum(
            row["estimated_external_corner_length"]
            * row["corner_rate"]
            * multiplier(row, "corner"),
            "corner",
        ),
        axis=1,
    )
    result["estimated_paint_mid"] = result.apply(
        lambda row: apply_minimum(
            row["estimated_paint_area"] * config["rates"]["paint_rate"] * multiplier(row, "paint"),
            "paint",
        ),
        axis=1,
    )
    result["estimated_render_mid"] = result.apply(
        lambda row: apply_minimum(
            row["render_area"] * config["rates"]["render_rate"] * multiplier(row, "render"),
            "render",
        ),
        axis=1,
    )

    result["estimated_total_mid"] = 0.0
    for component in COMPONENTS:
        include_col = f"include_{component}"
        if include_col not in result.columns:
            result[include_col] = True
        include_mask = result[include_col].apply(is_included)
        result.loc[include_mask, "estimated_total_mid"] += result.loc[
            include_mask,
            f"estimated_{component}_mid",
        ]

    for component in (*COMPONENTS, "total"):
        result[f"estimated_{component}_low"] = (
            result[f"estimated_{component}_mid"] * config["range"]["low_factor"]
        )
        result[f"estimated_{component}_high"] = (
            result[f"estimated_{component}_mid"] * config["range"]["high_factor"]
        )

    result["floor_area_band"] = result["floor_area"].apply(floor_area_band)
    return result


def add_error_metrics(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    optional_pairs = [
        ("actual_wall_area", "estimated_wall_area", "wall_area"),
        ("actual_fixing", "estimated_fixing_mid", "fixing"),
        ("actual_stopping", "estimated_stopping_mid", "stopping"),
        ("actual_square_stop", "estimated_square_stop_mid", "square_stop"),
        ("actual_corner", "estimated_corner_mid", "corner"),
        ("actual_paint", "estimated_paint_mid", "paint"),
        ("actual_render", "estimated_render_mid", "render"),
        ("actual_total", "estimated_total_mid", "total"),
    ]

    for actual_col, estimate_col, label in optional_pairs:
        if actual_col in result.columns:
            valid = result[actual_col].notna() & (result[estimate_col] > 0)
            result.loc[valid, f"{label}_ratio_actual_to_estimate"] = (
                result.loc[valid, actual_col] / result.loc[valid, estimate_col]
            )
            result.loc[valid, f"{label}_pct_error"] = (
                (result.loc[valid, estimate_col] - result.loc[valid, actual_col])
                / result.loc[valid, actual_col]
            )

    return result


def summarize_groups(df: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    group_fields = ["finish_level", "intertenancy_wall", "floor_area_band"]

    for field in group_fields:
        grouped = df.groupby(field, dropna=False)
        for value, group in grouped:
            row: dict[str, Any] = {
                "group_by": field,
                "group_value": value,
                "project_count": int(len(group)),
            }
            if "total_ratio_actual_to_estimate" in group:
                row["median_total_ratio_actual_to_estimate"] = float(
                    group["total_ratio_actual_to_estimate"].median()
                )
                row["mean_total_ratio_actual_to_estimate"] = float(
                    group["total_ratio_actual_to_estimate"].mean()
                )
            if "wall_area_ratio_actual_to_estimate" in group:
                row["median_wall_area_ratio_actual_to_estimate"] = float(
                    group["wall_area_ratio_actual_to_estimate"].median()
                )
            rows.append(row)

    return pd.DataFrame(rows)


def median_or_default(series: pd.Series, default: float) -> float:
    clean = series.dropna()
    if clean.empty:
        return default
    return float(clean.median())


def median_with_min_samples(series: pd.Series, default: float) -> float:
    clean = series.dropna()
    if len(clean) < MIN_SAMPLES_FOR_FACTOR_RECOMMENDATION:
        return default
    return float(clean.median())


def recommend_wall_factors(df: pd.DataFrame, config: dict[str, Any]) -> dict[str, float]:
    current = deepcopy(config["wallFactor"])
    if "actual_wall_area" not in df.columns:
        return current

    valid = df[df["floor_area"] > 0].copy()
    for finish_level in FINISH_LEVELS:
        inferred = valid.loc[valid["finish_level"] == finish_level, "actual_wall_area"] / valid.loc[
            valid["finish_level"] == finish_level, "floor_area"
        ]
        current[finish_level] = median_with_min_samples(inferred, current[finish_level])
    return current


def recommend_paint_factors(df: pd.DataFrame, config: dict[str, Any]) -> dict[str, float]:
    current = deepcopy(config["paintFactor"])
    if "actual_paint_area" not in df.columns:
        return current

    base_area = df["estimated_wall_area"] + df["estimated_ceiling_area"]
    valid = df[base_area > 0].copy()
    valid["inferred_paint_factor"] = valid["actual_paint_area"] / (
        valid["estimated_wall_area"] + valid["estimated_ceiling_area"]
    )
    for finish_level in FINISH_LEVELS:
        current[finish_level] = median_with_min_samples(
            valid.loc[valid["finish_level"] == finish_level, "inferred_paint_factor"],
            current[finish_level],
        )
    return current


def recommend_simple_rate(df: pd.DataFrame, config: dict[str, Any], actual_col: str, base_col: str, rate_key: str) -> float:
    if actual_col not in df.columns:
        return config["rates"][rate_key]

    subset = df[df[base_col] > 0].copy()
    if subset.empty:
        return config["rates"][rate_key]

    inferred = subset[actual_col] / subset[base_col]
    return median_or_default(inferred, config["rates"][rate_key])


def recommend_rate_above_minimum(
    df: pd.DataFrame,
    config: dict[str, Any],
    actual_col: str,
    base_col: str,
    rate_key: str,
    minimum_key: str,
) -> float:
    if actual_col not in df.columns:
        return config["rates"][rate_key]

    minimum = float(config.get("model", {}).get("minimums", {}).get(minimum_key, 0))
    subset = df[(df[base_col] > 0) & (df[actual_col] > minimum)].copy()
    if subset.empty:
        return config["rates"][rate_key]

    inferred = subset[actual_col] / subset[base_col]
    return median_or_default(inferred, config["rates"][rate_key])


def recommend_intertenancy_multiplier(df: pd.DataFrame, config: dict[str, Any]) -> float:
    if "actual_fixing_area" not in df.columns:
        return config["fixing"]["intertenancy_multiplier"]

    subset = df[(df["intertenancy_wall"] == "yes") & (df["estimated_wall_area"] > 0)].copy()
    if subset.empty:
        return config["fixing"]["intertenancy_multiplier"]

    inferred = subset["actual_fixing_area"] / subset["estimated_wall_area"]
    return median_with_min_samples(inferred, config["fixing"]["intertenancy_multiplier"])


def recommend_breakdown_factor(df: pd.DataFrame, config: dict[str, Any], actual_col: str, key: str) -> float:
    if actual_col not in df.columns:
        return config["stoppingBreakdown"][key]

    valid = df[df["floor_area"] > 0].copy()
    inferred = valid[actual_col] / valid["floor_area"]
    return median_with_min_samples(inferred, config["stoppingBreakdown"][key])


def recommend_range(df: pd.DataFrame, config: dict[str, Any]) -> dict[str, float]:
    current = deepcopy(config["range"])
    if "actual_total" not in df.columns or "total_ratio_actual_to_estimate" not in df.columns:
        return current

    ratios = df["total_ratio_actual_to_estimate"].dropna()
    if len(ratios) < MIN_SAMPLES_FOR_FACTOR_RECOMMENDATION:
        return current

    current["low_factor"] = float(ratios.quantile(0.10))
    current["high_factor"] = float(ratios.quantile(0.90))
    return current


def build_recommended_config(df: pd.DataFrame, config: dict[str, Any]) -> dict[str, Any]:
    recommended = deepcopy(config)
    recommended["wallFactor"] = recommend_wall_factors(df, config)
    recommended["paintFactor"] = recommend_paint_factors(df, config)
    recommended["fixing"]["intertenancy_multiplier"] = recommend_intertenancy_multiplier(df, config)
    recommended["stoppingBreakdown"]["square_stop_factor"] = recommend_breakdown_factor(
        df,
        config,
        "actual_square_stop_length",
        "square_stop_factor",
    )
    recommended["stoppingBreakdown"]["external_corner_factor"] = recommend_breakdown_factor(
        df,
        config,
        "actual_external_corner_length",
        "external_corner_factor",
    )
    recommended["rates"]["fixing_rate"] = recommend_simple_rate(
        df,
        config,
        "actual_fixing",
        "estimated_fixing_area",
        "fixing_rate",
    )
    recommended["rates"]["stopping_rate"] = recommend_simple_rate(
        df,
        config,
        "actual_stopping",
        "estimated_stopping_area",
        "stopping_rate",
    )
    recommended["rates"]["square_stop_rate"] = recommend_simple_rate(
        df,
        config,
        "actual_square_stop",
        "estimated_square_stop_length",
        "square_stop_rate",
    )
    recommended["rates"]["corner_rate"] = recommend_simple_rate(
        df,
        config,
        "actual_corner",
        "estimated_external_corner_length",
        "corner_rate",
    )
    recommended["rates"]["paint_rate"] = recommend_simple_rate(
        df,
        config,
        "actual_paint",
        "estimated_paint_area",
        "paint_rate",
    )
    recommended["rates"]["render_rate"] = recommend_rate_above_minimum(
        df,
        config,
        "actual_render",
        "render_area",
        "render_rate",
        "render",
    )
    recommended["range"] = recommend_range(df, config)
    return recommended


def validate_projects(df: pd.DataFrame) -> None:
    required_columns = {
        "project_name",
        "floor_area",
        "finish_level",
        "intertenancy_wall",
        "actual_total",
    }
    missing = required_columns.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    invalid_finish_levels = sorted(set(df["finish_level"].dropna()).difference(FINISH_LEVELS))
    if invalid_finish_levels:
        raise ValueError(f"Invalid finish_level values: {invalid_finish_levels}")

    invalid_intertenancy_values = sorted(
        set(df["intertenancy_wall"].dropna()).difference(INTERTENANCY_WALL)
    )
    if invalid_intertenancy_values:
        raise ValueError(f"Invalid intertenancy_wall values: {invalid_intertenancy_values}")


def main() -> None:
    args = parse_args()
    projects_path = Path(args.projects)
    config_path = Path(args.config)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    config = load_config(config_path)
    projects = pd.read_csv(projects_path)
    validate_projects(projects)

    project_report = calculate_estimates(projects, config)
    project_report = add_error_metrics(project_report)
    group_summary = summarize_groups(project_report)
    recommended_config = build_recommended_config(project_report, config)

    project_report.to_csv(output_dir / "project_report.csv", index=False)
    group_summary.to_csv(output_dir / "group_summary.csv", index=False)
    save_json(output_dir / "recommended_config.json", recommended_config)

    print("Calibration completed.")
    print(f"Project report: {output_dir / 'project_report.csv'}")
    print(f"Group summary: {output_dir / 'group_summary.csv'}")
    print(f"Recommended config: {output_dir / 'recommended_config.json'}")


if __name__ == "__main__":
    main()
