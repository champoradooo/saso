from rest_framework import serializers

from .models import DisciplinaryCase


class DisciplinaryCaseSerializer(
    serializers.ModelSerializer
):

    # =====================================================
    # STUDENT DISPLAY
    # =====================================================

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    student_id_display = serializers.CharField(
        source="student.student_id",
        read_only=True
    )

    # =====================================================
    # DISPLAY VALUES
    # =====================================================

    severity_display = serializers.CharField(
        source="get_severity_display",
        read_only=True
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    sanction_display = serializers.CharField(
        source="get_sanction_display",
        read_only=True
    )

    # =====================================================
    # FILES
    # =====================================================

    student_narrative = serializers.FileField(
        required=False,
        allow_null=True
    )

    reporter_narrative = serializers.FileField(
        required=False,
        allow_null=True
    )

    # =====================================================
    # META
    # =====================================================

    class Meta:

        model = DisciplinaryCase

        fields = "__all__"

        read_only_fields = [
            "case_number",
            "student_name",
            "student_id_display",
            "severity_display",
            "status_display",
            "sanction_display",
            "created_at",
            "updated_at",
        ]

    # =====================================================
    # VALIDATE
    #
    # Severity is automatically determined
    # from the selected violation.
    # =====================================================

    def validate(self, attrs):

        violation = (
            attrs.get(
                "violation",
                getattr(
                    self.instance,
                    "violation",
                    ""
                )
            )
            or ""
        ).strip()

        if violation:

            attrs["severity"] = (
                DisciplinaryCase
                .get_severity_for_violation(
                    violation
                )
            )

        return attrs

    # =====================================================
    # CREATE
    #
    # Case number is auto-generated on the model.
    # =====================================================

    def create(self, validated_data):

        validated_data.pop("case_number", None)

        violation = (
            validated_data
            .get("violation", "")
            .strip()
        )

        if violation:

            validated_data["severity"] = (
                DisciplinaryCase
                .get_severity_for_violation(
                    violation
                )
            )

        return super().create(
            validated_data
        )

    # =====================================================
    # UPDATE
    # =====================================================

    def update(
        self,
        instance,
        validated_data
    ):

        violation = (
            validated_data.get(
                "violation",
                instance.violation
            )
            or ""
        ).strip()

        if violation:

            validated_data["severity"] = (
                DisciplinaryCase
                .get_severity_for_violation(
                    violation
                )
            )

        return super().update(
            instance,
            validated_data
        )