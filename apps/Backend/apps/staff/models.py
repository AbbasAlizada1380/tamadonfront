from decimal import Decimal
from statistics import harmonic_mean

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _


class UpsentModel(models.Model):
    day = models.DateField()
    staff = models.ForeignKey(
        "Staff", on_delete=models.PROTECT, related_name="upsent_models"
    )

    def __str__(self):
        return f"Upsent day: {self.day} - Staff: {self.staff.name}"

    def create_salary(self):
        staff = self.staff
        salary_for_the_day = staff.salary_per_day
        total_salary = staff.total - salary_for_the_day
        staff.total = total_salary
        staff.save()
        Salary.objects.create(staff=staff, amount=salary_for_the_day)


class Staff(models.Model):
    class Position(models.TextChoices):
        DESIGNER = "Designer", _("Designer")
        RECEPTION = "Reception", _("Reception")
        PRINTER = "Printer", _("Printer")
        OTHER = "Other", _("Other")

    class State(models.TextChoices):
        ACTIVE = "Active", _("Active")
        INACTIVE = "Inactive", _("Inactive")

    class Location(models.TextChoices):
        FACTORY = "Factory", _("Factory")
        SHOP = "Shop", _("Shop")
        OTHER = "Other", _("Other")

    name = models.CharField(_("Name"), max_length=250)
    father_name = models.CharField(_("Father Name"), max_length=250)
    nic = models.IntegerField(_("NIC"))
    photo = models.ImageField(upload_to="staff/images")
    address = models.CharField(_("Address"), max_length=250)
    salary_per_day = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    location = models.CharField(_("Location"), choices=Location.choices, max_length=255)
    position = models.CharField(_("Position"), choices=Position.choices, max_length=250)
    state = models.CharField(
        _("State"), choices=State.choices, max_length=250, default=State.ACTIVE
    )
    total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    upsent_day = models.ForeignKey(
        UpsentModel, on_delete=models.PROTECT, related_name="staff_members"
    )
    
    

    clear_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.position})"


class Salary(models.Model):
    staff = models.ForeignKey(
        Staff, on_delete=models.PROTECT, related_name="staff_salary"
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def __str__(self):
        return f"{self.staff.name} - {self.amount}"


# Signal to trigger salary creation after an UpsentModel is created
@receiver(post_save, sender=UpsentModel)
def handle_upsent_salary(sender, instance, created, **kwargs):
    if created:
        instance.create_salary()
