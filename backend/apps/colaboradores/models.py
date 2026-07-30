from django.db import models


class Colaborador(models.Model):
    """Servidor/colaborador que pode retirar itens ou receber patrimônio.

    Equivalente à tabela ``Colaboradores`` do charl.
    """

    nome = models.CharField(max_length=200)
    setor = models.CharField(max_length=120, blank=True)
    matricula = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self) -> str:
        return self.nome
