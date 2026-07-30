from django.conf import settings
from django.db import models


class Movimentacao(models.Model):
    """Movimentação de estoque (saída, empréstimo ou devolução).

    Equivalente à tabela ``Movimentacoes`` do charl.
    """

    class Tipo(models.TextChoices):
        SAIDA = "Saída", "Saída"
        EMPRESTIMO = "Empréstimo", "Empréstimo"
        DEVOLUCAO = "Devolução", "Devolução"

    class Status(models.TextChoices):
        PENDENTE = "Pendente", "Pendente"
        APROVADO = "Aprovado", "Aprovado"
        REJEITADO = "Rejeitado", "Rejeitado"
        CONCLUIDO = "Concluído", "Concluído"

    item = models.ForeignKey("itens.Item", on_delete=models.PROTECT, related_name="movimentacoes")
    colaborador = models.ForeignKey(
        "colaboradores.Colaborador", on_delete=models.PROTECT, related_name="movimentacoes"
    )
    quantidade = models.PositiveIntegerField()
    tipo_movimento = models.CharField(max_length=20, choices=Tipo.choices)
    status_ti = models.CharField(max_length=20, choices=Status.choices, default=Status.APROVADO)
    data_hora = models.DateTimeField(auto_now_add=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimentacoes_criadas",
    )

    class Meta:
        ordering = ["-data_hora"]

    def __str__(self) -> str:
        return f"{self.tipo_movimento} #{self.pk} - {self.item_id}"
