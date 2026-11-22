from django.contrib import admin
from .models import LostFoundItem


@admin.register(LostFoundItem)
class LostFoundItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_type",
        "item",
        "name",
        "date_filing",
        "location",
        "status",
        "claim_status",
    )

    list_filter = (
        "item_type",
        "status",
        "claim_status",
    )

    search_fields = (
        "item",
        "name",
        "location",
        "claimant_name",
    )