from rest_framework import serializers
from .models import Student, ClearanceRequirement, CounselingRecord


class ClearanceRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClearanceRequirement
        fields = '__all__'


class CounselingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounselingRecord
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Student
        fields = '__all__'


class StudentDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    clearance_requirements = ClearanceRequirementSerializer(many=True, read_only=True)
    counseling_records = CounselingRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
