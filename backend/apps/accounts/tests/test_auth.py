import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin1", password="Senha123!", role=User.Role.ADMINISTRATIVO
    )


@pytest.mark.django_db
def test_login_retorna_tokens_e_dados_do_usuario(admin_user):
    client = APIClient()
    response = client.post(
        "/api/auth/token/",
        {"username": "admin1", "password": "Senha123!"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
    assert response.data["user"]["role"] == User.Role.ADMINISTRATIVO


@pytest.mark.django_db
def test_login_com_senha_errada_falha(admin_user):
    client = APIClient()
    response = client.post(
        "/api/auth/token/",
        {"username": "admin1", "password": "errada"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_endpoint_administrativo_exige_autenticacao():
    client = APIClient()
    response = client.post("/api/colaboradores/", {"nome": "Teste"}, format="json")
    assert response.status_code == 401


@pytest.mark.django_db
def test_criar_colaborador_exige_perfil_admin(db):
    User.objects.create_user(
        username="colab1", password="Senha123!", role=User.Role.COLABORADOR
    )
    client = APIClient()
    login = client.post(
        "/api/auth/token/",
        {"username": "colab1", "password": "Senha123!"},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    response = client.post("/api/colaboradores/", {"nome": "Teste"}, format="json")
    assert response.status_code == 403
