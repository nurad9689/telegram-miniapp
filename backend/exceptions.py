from fastapi import HTTPException, status


class DatabaseError(HTTPException):
    """Базовое исключение для ошибок базы данных"""
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )


class NotFoundError(HTTPException):
    """Исключение для ресурсов, которые не найдены"""
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found"
        )


class ConflictError(HTTPException):
    """Исключение для конфликтов (например, дубликаты)"""
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class ValidationError(HTTPException):
    """Исключение для ошибок валидации"""
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class UnauthorizedError(HTTPException):
    """Исключение для ошибок авторизации"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class ForbiddenError(HTTPException):
    """Исключение для ошибок доступа"""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )