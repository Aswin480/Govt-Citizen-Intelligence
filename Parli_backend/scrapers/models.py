from django.db import models

class Bill(models.Model):
    bill_number = models.CharField(max_length=100, null=True, blank=True)
    bill_name = models.TextField()
    bill_type = models.CharField(max_length=100, null=True, blank=True)
    bill_category = models.CharField(max_length=100, null=True, blank=True)
    ministry_name = models.CharField(max_length=255, null=True, blank=True)
    bill_year = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.bill_name

class MLA(models.Model):
    state_ut = models.CharField(max_length=100)
    district = models.CharField(max_length=100, null=True, blank=True)
    constituency_no = models.CharField(max_length=100, null=True, blank=True)
    constituency = models.CharField(max_length=255, null=True, blank=True)
    member = models.CharField(max_length=255)
    party = models.CharField(max_length=100, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    member_profile = models.TextField(null=True, blank=True)
    party_color = models.CharField(max_length=50, null=True, blank=True)
    is_minister = models.CharField(max_length=10, default="No")
    portfolio = models.TextField(null=True, blank=True)
    is_chief_minister = models.CharField(max_length=10, default="No")

    def __str__(self):
        return f"{self.member} ({self.state_ut})"

class LokSabhaAttendance(models.Model):
    mpsno = models.IntegerField(null=True, blank=True)
    member_name = models.CharField(max_length=255)
    constituency = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    state_code = models.CharField(max_length=10, null=True, blank=True)
    signed_days_count = models.IntegerField(default=0)
    division = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.member_name

class RajyaSabhaAttendance(models.Model):
    session_no = models.IntegerField(null=True, blank=True)
    mpsno = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255)
    div_no = models.CharField(max_length=50, null=True, blank=True)
    state_code = models.CharField(max_length=10, null=True, blank=True)
    no_of_sittings = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Governor(models.Model):
    state = models.CharField(max_length=100)
    governor_name = models.CharField(max_length=255)
    took_office = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.governor_name} ({self.state})"

