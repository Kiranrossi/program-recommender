from typing import Any


def model_to_dict(model: Any, exclude: set[str] | None = None) -> dict:
    exclude = exclude or set()
    data: dict = {}
    for column in model.__table__.columns:
        if column.name in exclude:
            continue
        data[column.name] = getattr(model, column.name)
    return data
