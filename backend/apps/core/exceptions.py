"""Exceções e handler compartilhados pela camada de services.

Qualquer violação de regra de negócio no service layer deve levantar
``DomainError`` em vez de retornar tuplas ``(bool, str)`` como no
``backend.py`` original do charl. O ``custom_exception_handler`` converte
isso automaticamente em uma resposta HTTP 400 consistente para o front.
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class DomainError(Exception):
    """Violação de regra de negócio detectada na camada de services."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def custom_exception_handler(exc, context):
    if isinstance(exc, DomainError):
        return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)
    return drf_exception_handler(exc, context)
