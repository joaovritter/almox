from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuário do sistema. Substitui a tabela ``Usuarios`` do charl.

    Os perfis (``role``) espelham exatamente os do sistema original:
    Colaborador, Administrativo e Super_Administrativo.
    """

    class Role(models.TextChoices):
        COLABORADOR = "colaborador", "Colaborador"
        ADMINISTRATIVO = "administrativo", "Administrativo"
        SUPER_ADMINISTRATIVO = "super_administrativo", "Super Administrativo"

    nome = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.COLABORADOR)

    @property
    def is_admin_role(self) -> bool:
        return self.is_superuser or self.role in (
            self.Role.ADMINISTRATIVO,
            self.Role.SUPER_ADMINISTRATIVO,
        )

    @property
    def is_super_admin_role(self) -> bool:
        return self.is_superuser or self.role == self.Role.SUPER_ADMINISTRATIVO

    def __str__(self) -> str:
        return self.nome or self.username
