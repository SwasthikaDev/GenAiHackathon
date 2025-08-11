from django.db import models
from django.conf import settings
from django.utils.text import slugify
from decimal import Decimal


class City(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True)
    cost_index = models.IntegerField(null=True, blank=True)
    popularity = models.IntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.name}, {self.country}"


class Trip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trips')
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    origin_city = models.ForeignKey('City', null=True, blank=True, on_delete=models.SET_NULL, related_name='origin_trips')
    description = models.TextField(blank=True)
    cover_image = models.URLField(blank=True)
    is_public = models.BooleanField(default=False)
    public_slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Ensure slug only generated when sharing, and uniqueness by suffixing
        generating = self.is_public and not self.public_slug
        super().save(*args, **kwargs)
        if generating:
            base = slugify(f"{self.user_id}-{self.name}")[:220]
            slug = f"{base}-{self.pk}"
            # In rare case of collision, add random suffix
            if Trip.objects.filter(public_slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{self.pk}-s"
            self.public_slug = slug
            super().save(update_fields=["public_slug"])

    def __str__(self) -> str:
        return self.name


class TripStop(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    city = models.ForeignKey(City, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    order = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'start_date']


class Activity(models.Model):
    trip_stop = models.ForeignKey(TripStop, on_delete=models.CASCADE, related_name='activities')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    cost_amount = models.IntegerField(default=0)
    currency = models.CharField(max_length=10, default='INR')
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class ActivityCatalog(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True)
    avg_cost = models.IntegerField(default=0)
    duration_minutes = models.IntegerField(null=True, blank=True)
    city = models.ForeignKey(City, null=True, blank=True, on_delete=models.SET_NULL)

# Create your models here.


class ExternalPlace(models.Model):
    """Snapshot of an external places API result (e.g., Nominatim) for dataset building."""
    source = models.CharField(max_length=50, default='nominatim')
    query = models.CharField(max_length=200, blank=True)
    external_id = models.CharField(max_length=100, blank=True, db_index=True)
    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    raw = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['source', 'external_id']),
            models.Index(fields=['name', 'country']),
        ]

    def __str__(self) -> str:
        return f"{self.name}, {self.country} ({self.source}:{self.external_id})"


class PersonalizedRec(models.Model):
    """Cache of LLM-personalized recommendations per user.

    We store a signature derived from the user's profile fields and trip meta
    so we can avoid calling the LLM unless there are changes.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='personalized_recs')
    signature = models.CharField(max_length=128, db_index=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'country']),
        ]

    def __str__(self) -> str:
        return f"Rec[{self.user_id}] {self.signature[:8]}... at {self.created_at}"
