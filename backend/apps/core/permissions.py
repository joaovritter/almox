from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Equivalente aos perfis Administrativo / Super_Administrativo do charl."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin_role)


class IsSuperAdminRole(BasePermission):
    """Equivalente ao perfil Super_Administrativo do charl."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_super_admin_role)
