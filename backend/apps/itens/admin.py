from django.contrib import admin

from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("codigo_item", "nome_item", "tipo", "quantidade_atual", "requer_aprovacao")
    list_filter = ("tipo", "requer_aprovacao")
    search_fields = ("codigo_item", "nome_item")
