from django.db import models


class Item(models.Model):
    """Item de estoque do almoxarifado. Equivalente à tabela ``Itens`` do charl."""

    class Tipo(models.TextChoices):
        ESCRITORIO = "Escritório", "Escritório"
        COPA = "Copa", "Copa"
        TI = "TI", "TI"
        GERAL = "Geral", "Geral"
        TEMPORARIO = "Temporário", "Temporário"

    codigo_item = models.CharField(max_length=50, unique=True)
    nome_item = models.CharField(max_length=200)
    quantidade_atual = models.PositiveIntegerField(default=0)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    requer_aprovacao = models.BooleanField(
        default=False,
        help_text="Se marcado, saídas/empréstimos deste item ficam Pendentes até aprovação (regra do charl para itens de TI).",
    )

    class Meta:
        ordering = ["nome_item"]

    def __str__(self) -> str:
        return f"{self.codigo_item} - {self.nome_item}"
