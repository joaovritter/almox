from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (("Perfil almoxarifado", {"fields": ("nome", "role")}),)
    list_display = ("username", "nome", "role", "is_staff", "is_active")
    list_filter = DjangoUserAdmin.list_filter + ("role",)
