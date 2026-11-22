import csv
import io
import re

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser

from .models import (
    Student,
    ClearanceRequirement,
    CounselingRecord,
)

from .serializers import (
    StudentSerializer,
    StudentDetailSerializer,
    ClearanceRequirementSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):

    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    # =========================================================
    # QUERYSET
    # =========================================================

    def get_queryset(self):

        if self.action == "archived":
            return Student.objects.filter(
                is_archived=True
            )

        return Student.objects.filter(
            is_archived=False
        )

    # =========================================================
    # PENDING
    # =========================================================

    @action(
        detail=False,
        methods=["get"]
    )
    def pending(self, request):

        pending = self.get_queryset().filter(
            status="pending"
        )

        serializer = self.get_serializer(
            pending,
            many=True
        )

        return Response(serializer.data)

    # =========================================================
    # COMPLETED
    # =========================================================

    @action(
        detail=False,
        methods=["get"]
    )
    def completed(self, request):

        completed = self.get_queryset().filter(
            status="completed"
        )

        serializer = self.get_serializer(
            completed,
            many=True
        )

        return Response(serializer.data)

    # =========================================================
    # ARCHIVE STUDENT
    # =========================================================

    @action(
        detail=True,
        methods=["post"]
    )
    def archive(self, request, pk=None):

        student = get_object_or_404(
            Student,
            pk=pk
        )

        student.is_archived = True

        student.archive_reason = request.data.get(
            "reason",
            "Archived"
        )

        student.archived_date = timezone.now().date()

        student.save()

        return Response({
            "message": "Student archived successfully."
        })

    # =========================================================
    # ARCHIVED STUDENTS
    # =========================================================

    @action(
        detail=False,
        methods=["get"]
    )
    def archived(self, request):

        archived_students = Student.objects.filter(
            is_archived=True
        ).order_by(
            "-archived_date",
            "-id",
        )

        serializer = self.get_serializer(
            archived_students,
            many=True
        )

        return Response(
            serializer.data
        )

    # =========================================================
    # IMPORT STUDENTS
    # =========================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def import_students(self, request):

        # -----------------------------------------------------
        # GET FILE
        # -----------------------------------------------------

        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {
                    "detail":
                        "Please upload a CSV or Excel file."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = uploaded_file.name.lower()

        # =====================================================
        # READ CSV
        # =====================================================

        if filename.endswith(".csv"):

            try:
                raw_text = uploaded_file.read().decode(
                    "utf-8-sig"
                )

            except UnicodeDecodeError:

                return Response(
                    {
                        "detail":
                            "CSV file must be UTF-8 encoded."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            reader = csv.DictReader(
                io.StringIO(raw_text)
            )

            if not reader.fieldnames:

                return Response(
                    {
                        "detail":
                            "CSV file is missing headers."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            rows = list(reader)

        # =====================================================
        # READ EXCEL
        # =====================================================

        elif filename.endswith(".xlsx"):

            try:

                from openpyxl import load_workbook

            except ImportError:

                return Response(
                    {
                        "detail":
                            "Excel import requires the openpyxl package. "
                            "Run: py -m pip install openpyxl"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            workbook = None

            try:

                workbook = load_workbook(
                    uploaded_file,
                    read_only=True,
                    data_only=True
                )

                worksheet = workbook.active

                rows_data = list(
                    worksheet.iter_rows(
                        values_only=True
                    )
                )

            except Exception as error:

                return Response(
                    {
                        "detail":
                            f"Unable to read Excel file: {error}"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            finally:

                if workbook is not None:
                    try:
                        workbook.close()
                    except Exception:
                        pass

            if not rows_data:

                return Response(
                    {
                        "detail":
                            "Excel file is empty."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            headers = rows_data[0]

            if not headers:

                return Response(
                    {
                        "detail":
                            "Excel file is missing headers."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            headers = [
                str(header).strip()
                if header is not None
                else ""
                for header in headers
            ]

            rows = []

            for row_values in rows_data[1:]:

                row = {}

                for index, header in enumerate(headers):

                    if not header:
                        continue

                    value = (
                        row_values[index]
                        if index < len(row_values)
                        else ""
                    )

                    row[header] = (
                        ""
                        if value is None
                        else value
                    )

                rows.append(row)

        # =====================================================
        # UNSUPPORTED FILE
        # =====================================================

        else:

            return Response(
                {
                    "detail":
                        "Unsupported file type. "
                        "Please upload a .csv or .xlsx file."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # CHECK ROWS
        # =====================================================

        if not rows:

            return Response(
                {
                    "detail":
                        "The uploaded file contains no student records."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # NORMALIZE HEADERS
        # =====================================================

        first_row = rows[0]

        normalized_headers = {
            self._normalize_header(header): header
            for header in first_row.keys()
        }

        required_fields = [
            "student_id",
            "first_name",
            "last_name",
            "course",
            "year_level",
            "address",
        ]

        missing_fields = [
            field
            for field in required_fields
            if field not in normalized_headers
        ]

        if missing_fields:

            return Response(
                {
                    "detail":
                        "File is missing required columns.",
                    "missing_fields":
                        missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # IMPORT COUNTERS
        # =====================================================

        created_count = 0
        updated_count = 0

        errors = []

        # =====================================================
        # PROCESS STUDENTS
        # =====================================================

        for index, row in enumerate(
            rows,
            start=2
        ):

            student_data = (
                self._extract_student_row(row)
            )

            # -------------------------------------------------
            # STUDENT ID
            # -------------------------------------------------

            student_id = str(
                student_data.get(
                    "student_id"
                ) or ""
            ).strip()

            if not student_id:

                errors.append(
                    {
                        "row": index,
                        "detail":
                            "Student ID is required."
                    }
                )

                continue

            # -------------------------------------------------
            # YEAR LEVEL
            # -------------------------------------------------

            year_level_value = (
                student_data.get(
                    "year_level"
                )
            )

            year_level = self._normalize_year_level(
                year_level_value
            )

            if year_level is None:

                errors.append(
                    {
                        "row": index,
                        "student_id":
                            student_id,
                        "detail":
                            "Year level must be 1, 2, 3, or 4. "
                            "Accepted formats include "
                            "'1', '1st', '1st Year', "
                            "'2', '2nd', '2nd Year', "
                            "'3', '3rd', '3rd Year', "
                            "'4', '4th', or '4th Year'."
                    }
                )

                continue

            # -------------------------------------------------
            # STATUS
            # -------------------------------------------------

            status_value = str(
                student_data.get(
                    "status"
                )
                or Student.STATUS_PENDING
            ).strip().lower()

            valid_statuses = dict(
                Student.STATUS_CHOICES
            )

            if status_value not in valid_statuses:

                status_value = (
                    Student.STATUS_PENDING
                )

            # -------------------------------------------------
            # STUDENT DATA
            # -------------------------------------------------

            defaults = {

                "first_name":
                    str(
                        student_data.get(
                            "first_name",
                            ""
                        )
                    ).strip(),

                "last_name":
                    str(
                        student_data.get(
                            "last_name",
                            ""
                        )
                    ).strip(),

                "middle_name":
                    str(
                        student_data.get(
                            "middle_name",
                            ""
                        )
                    ).strip(),

                "course":
                    str(
                        student_data.get(
                            "course",
                            ""
                        )
                    ).strip(),

                "year_level":
                    year_level,

                "address":
                    str(
                        student_data.get(
                            "address",
                            ""
                        )
                    ).strip(),

                "email":
                    str(
                        student_data.get(
                            "email",
                            ""
                        )
                    ).strip(),

                "phone":
                    str(
                        student_data.get(
                            "phone",
                            ""
                        )
                    ).strip(),

                "status":
                    status_value,
            }

            # -------------------------------------------------
            # REQUIRED VALUES
            # -------------------------------------------------

            missing_required = [
                field
                for field in [
                    "first_name",
                    "last_name",
                    "course",
                    "address",
                ]
                if not defaults[field]
            ]

            if missing_required:

                errors.append(
                    {
                        "row": index,
                        "student_id":
                            student_id,
                        "detail":
                            "Missing required values: "
                            +
                            ", ".join(
                                missing_required
                            )
                            + ".",
                    }
                )

                continue

            # -------------------------------------------------
            # CREATE OR UPDATE
            # -------------------------------------------------

            try:

                _, created = (
                    Student.objects.update_or_create(
                        student_id=student_id,
                        defaults=defaults
                    )
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as error:

                errors.append(
                    {
                        "row": index,
                        "student_id":
                            student_id,
                        "detail":
                            str(error),
                    }
                )

        # =====================================================
        # RESPONSE
        # =====================================================

        if (
            created_count == 0
            and
            updated_count == 0
        ):

            return Response(
                {
                    "created": 0,
                    "updated": 0,
                    "errors": errors[:25],
                    "has_errors": bool(errors),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "created":
                    created_count,

                "updated":
                    updated_count,

                "errors":
                    errors[:25],

                "has_errors":
                    bool(errors),
            },
            status=status.HTTP_200_OK
        )

    # =========================================================
    # NORMALIZE YEAR LEVEL
    # =========================================================

    @staticmethod
    def _normalize_year_level(value):

        if value is None:
            return None

        # -----------------------------------------------------
        # Handle Excel numeric values
        # -----------------------------------------------------

        if isinstance(value, int):
            if value in (1, 2, 3, 4):
                return value

            return None

        if isinstance(value, float):

            if value.is_integer():

                number = int(value)

                if number in (1, 2, 3, 4):
                    return number

            return None

        # -----------------------------------------------------
        # Convert value to text
        # -----------------------------------------------------

        text = str(value).strip().lower()

        if not text:
            return None

        # Remove extra spaces
        text = re.sub(
            r"\s+",
            " ",
            text
        )

        # -----------------------------------------------------
        # Direct numeric values
        # -----------------------------------------------------

        numeric_mapping = {
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
        }

        if text in numeric_mapping:
            return numeric_mapping[text]

        # -----------------------------------------------------
        # Decimal values from Excel/CSV
        # Example: 1.0
        # -----------------------------------------------------

        try:

            numeric_value = float(text)

            if numeric_value.is_integer():

                number = int(numeric_value)

                if number in (1, 2, 3, 4):
                    return number

        except ValueError:
            pass

        # -----------------------------------------------------
        # Remove punctuation
        # Example:
        # 1st-Year -> 1st year
        # 2nd_Year -> 2nd year
        # -----------------------------------------------------

        text = re.sub(
            r"[-_]+",
            " ",
            text
        )

        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        # -----------------------------------------------------
        # Year-level mapping
        # -----------------------------------------------------

        year_mapping = {

            # First year
            "1st": 1,
            "1st year": 1,
            "first": 1,
            "first year": 1,
            "year 1": 1,
            "year one": 1,
            "first-year": 1,

            # Second year
            "2nd": 2,
            "2nd year": 2,
            "second": 2,
            "second year": 2,
            "year 2": 2,
            "year two": 2,
            "second-year": 2,

            # Third year
            "3rd": 3,
            "3rd year": 3,
            "third": 3,
            "third year": 3,
            "year 3": 3,
            "year three": 3,
            "third-year": 3,

            # Fourth year
            "4th": 4,
            "4th year": 4,
            "fourth": 4,
            "fourth year": 4,
            "year 4": 4,
            "year four": 4,
            "fourth-year": 4,
        }

        return year_mapping.get(text)

    # =========================================================
    # EXTRACT STUDENT ROW
    # =========================================================

    def _extract_student_row(self, row):

        aliases = {

            "student_id": {
                "student_id",
                "studentid",
                "student id",
                "student_no",
                "student number",
                "id",
            },

            "first_name": {
                "first_name",
                "firstname",
                "first name",
                "given_name",
                "given name",
            },

            "middle_name": {
                "middle_name",
                "middlename",
                "middle name",
            },

            "last_name": {
                "last_name",
                "lastname",
                "last name",
                "surname",
                "family_name",
                "family name",
            },

            "course": {
                "course",
                "program",
                "degree",
            },

            "year_level": {
                "year_level",
                "year level",
                "year",
            },

            "address": {
                "address",
                "home address",
            },

            "email": {
                "email",
                "email address",
            },

            "phone": {
                "phone",
                "contact number",
                "contact",
                "mobile",
            },

            "status": {
                "status",
            },
        }

        normalized_row = {}

        for key, value in row.items():

            normalized_row[
                self._normalize_header(key)
            ] = value

        extracted = {}

        for canonical_key, candidates in aliases.items():

            for candidate in candidates:

                normalized_candidate = (
                    self._normalize_header(
                        candidate
                    )
                )

                if (
                    normalized_candidate
                    in normalized_row
                ):

                    extracted[
                        canonical_key
                    ] = normalized_row[
                        normalized_candidate
                    ]

                    break

            else:

                extracted[
                    canonical_key
                ] = ""

        return extracted

    # =========================================================
    # NORMALIZE HEADER
    # =========================================================

    @staticmethod
    def _normalize_header(value):

        return re.sub(
            r"[^a-z0-9]+",
            "_",
            str(value)
            .strip()
            .lower()
        ).strip("_")


# =============================================================
# CLEARANCE REQUIREMENTS
# =============================================================

class ClearanceRequirementViewSet(
    viewsets.ModelViewSet
):

    queryset = ClearanceRequirement.objects.all()

    serializer_class = (
        ClearanceRequirementSerializer
    )