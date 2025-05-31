from rest_framework import serializers

from .models import Salary, Staff, UpsentModel


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "name",
            "father_name",
            "nic",
            "photo",
            "address",
            "salary_per_day",
            "location",
            "position",
            "state",
            "total",
            "clear_date",
            "upsent_day",
        ]


class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = ["id", "staff", "amount"]


class UpsentModelSerializer(serializers.ModelSerializer):
    staff = StaffSerializer()

    class Meta:
        model = UpsentModel
        fields = ["id", "day", "staff"]

    def create(self, validated_data):
        staff_data = validated_data.pop("staff")
        upsent_instance = UpsentModel.objects.create(**validated_data)

        upsent_instance.create_salary()

        return upsent_instance
