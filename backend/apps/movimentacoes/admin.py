from django.contrib import admin

from .models import Movimentacao


@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "item", "colaborador", "tipo_movimento", "status_ti", "quantidade", "data_hora")
    list_filter = ("tipo_movimento", "status_ti")
    search_fields = ("item__nome_item", "colaborador__nome")
