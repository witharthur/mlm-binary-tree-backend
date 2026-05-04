from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppError):
    def __init__(self, entity: str = "Resource"):
        super().__init__(f"{entity} not found", status.HTTP_404_NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(detail, status.HTTP_409_CONFLICT)


class InsufficientFundsError(AppError):
    def __init__(self):
        super().__init__("Insufficient funds", status.HTTP_400_BAD_REQUEST)


class IdempotencyConflict(AppError):
    """Raised when an idempotency key has already been used."""
    def __init__(self):
        super().__init__("This operation has already been processed", status.HTTP_409_CONFLICT)


class TreePlacementError(AppError):
    def __init__(self, detail: str = "Cannot place user in tree"):
        super().__init__(detail, status.HTTP_400_BAD_REQUEST)
