from django.db import models


class LostFoundItem(models.Model):
    TYPE_CHOICES = [
        ("Lost", "Lost"),
        ("Found", "Found"),
    ]

    STATUS_CHOICES = [
        ("Not Found", "Not Found"),
        ("Found", "Found"),
        ("Claimed", "Claimed"),
    ]

    CLAIM_STATUS_CHOICES = [
        ("Not Claimed", "Not Claimed"),
        ("Claimed", "Claimed"),
    ]

    # Lost or Found
    item_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        default="Lost",
    )

    # Date the report was filed
    date_filing = models.DateField()

    # Person who reported the item
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # Example: BSIT 3
    year_course = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # Name of the item
    item = models.CharField(
        max_length=255,
    )

    # Date and time the item was lost/found
    date_time = models.DateTimeField(
        blank=True,
        null=True,
    )

    # Where the item was lost/found
    location = models.CharField(
        max_length=255,
    )

    # Contact information of the person who reported it
    contact = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # Current status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Not Found",
    )

    # Claim status
    claim_status = models.CharField(
        max_length=20,
        choices=CLAIM_STATUS_CHOICES,
        default="Not Claimed",
    )

    # Person who claimed the item
    claimant_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # Course/year of claimant
    claimant_course = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    # Date the item was claimed
    date_claimed = models.DateField(
        blank=True,
        null=True,
    )

    # Archive flag
    # Archived records remain in the database but are hidden from the active list.
    archived = models.BooleanField(
        default=False,
    )

    # Date and time when the record was archived
    archived_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Automatically recorded when the database record is created
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    # Automatically updated whenever the record changes
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Lost & Found Item"
        verbose_name_plural = "Lost & Found Items"

    def __str__(self):
        return f"{self.item} - {self.item_type}"
