from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Salary, Staff, UpsentModel
from .serializers import SalarySerializer, StaffSerializer, UpsentModelSerializer


# View for listing and creating UpsentModel instances
class UpsentModelListCreateView(generics.ListCreateAPIView):
    queryset = UpsentModel.objects.all()
    serializer_class = UpsentModelSerializer
    permission_classes = [AllowAny]


# View for retrieving, updating, and deleting an UpsentModel instance
class UpsentModelRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UpsentModel.objects.all()
    serializer_class = UpsentModelSerializer
    permission_classes = [AllowAny]


# View for listing and creating Staff instances
class StaffListCreateView(generics.ListCreateAPIView):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]


# View for retrieving, updating, and deleting a Staff instance
class StaffRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]


# View for listing and creating Salary instances
class SalaryListCreateView(generics.ListCreateAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [AllowAny]


# View for retrieving, updating, and deleting a Salary instance
class SalaryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    permission_classes = [AllowAny]
