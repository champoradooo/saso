import json
from datetime import datetime

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import LostFoundItem


# =========================================================
# SERIALIZER
# =========================================================

def serialize_record(record):
    return {
        "id": record.id,
        "item_type": record.item_type,

        "date_filing": (
            record.date_filing.isoformat()
            if record.date_filing
            else None
        ),

        "name": record.name,
        "year_course": record.year_course,
        "item": record.item,

        "date_time": (
            record.date_time.isoformat()
            if record.date_time
            else None
        ),

        "location": record.location,
        "contact": record.contact,

        "status": record.status,
        "claim_status": record.claim_status,

        "claimant_name": record.claimant_name,
        "claimant_course": record.claimant_course,

        "date_claimed": (
            record.date_claimed.isoformat()
            if record.date_claimed
            else None
        ),

        "archived": record.archived,

        "archived_at": (
            record.archived_at.isoformat()
            if record.archived_at
            else None
        ),

        "created_at": (
            record.created_at.isoformat()
            if record.created_at
            else None
        ),

        "updated_at": (
            record.updated_at.isoformat()
            if record.updated_at
            else None
        ),
    }


# =========================================================
# CLEAN VALUE
# =========================================================

def clean_value(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()

        if value == "":
            return None

    return value


# =========================================================
# DATE PARSER
# =========================================================

def parse_date(value):
    value = clean_value(value)

    if value is None:
        return None

    if hasattr(value, "year") and hasattr(value, "month"):
        return value

    try:
        return datetime.strptime(
            str(value),
            "%Y-%m-%d"
        ).date()

    except (ValueError, TypeError):
        raise ValueError(
            f"Invalid date format: {value}. "
            "Expected YYYY-MM-DD."
        )


# =========================================================
# DATETIME PARSER
# =========================================================

def parse_datetime(value):
    value = clean_value(value)

    if value is None:
        return None

    if isinstance(value, datetime):
        parsed = value

    else:
        try:
            parsed = datetime.fromisoformat(
                str(value).replace("Z", "+00:00")
            )

        except (ValueError, TypeError):
            raise ValueError(
                f"Invalid date and time format: {value}."
            )

    # Convert naive datetime into timezone-aware datetime
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(
            parsed,
            timezone.get_current_timezone()
        )

    return parsed


# =========================================================
# VALIDATION
# =========================================================

def validate_item_type(item_type):
    return item_type in {
        "Lost",
        "Found",
    }


def validate_status(status):
    return status in {
        "Not Found",
        "Found",
        "Claimed",
    }


def validate_claim_status(claim_status):
    return claim_status in {
        "Not Claimed",
        "Claimed",
    }


# =========================================================
# NORMALIZE CLAIM INFORMATION
# =========================================================

def normalize_claim_information(data):
    item_type = data.get("item_type")

    claim_status = data.get(
        "claim_status",
        "Not Claimed"
    )

    if claim_status == "Claimed":

        data["claimant_name"] = clean_value(
            data.get("claimant_name")
        )

        data["claimant_course"] = clean_value(
            data.get("claimant_course")
        )

        data["date_claimed"] = parse_date(
            data.get("date_claimed")
        ) if data.get("date_claimed") else None

        data["status"] = "Claimed"

    else:

        data["claimant_name"] = None
        data["claimant_course"] = None
        data["date_claimed"] = None

        if item_type == "Lost":
            data["status"] = "Not Found"

        else:
            data["status"] = "Found"

    return data


# =========================================================
# LIST + CREATE
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def lost_found_list(request):

    # =====================================================
    # GET RECORDS
    # =====================================================

    if request.method == "GET":

        show_archived = (
            request.GET.get(
                "archived",
                ""
            ).lower() == "true"
        )

        records = (
            LostFoundItem.objects
            .filter(
                archived=show_archived
            )
            .order_by("-created_at")
        )

        return JsonResponse(
            [
                serialize_record(record)
                for record in records
            ],
            safe=False
        )

    # =====================================================
    # CREATE RECORD
    # =====================================================

    try:

        body = json.loads(
            request.body or "{}"
        )

        # -------------------------------------------------
        # BASIC VALUES
        # -------------------------------------------------

        item_type = body.get(
            "item_type",
            "Lost"
        )

        date_filing_raw = body.get(
            "date_filing"
        )

        item = clean_value(
            body.get("item")
        )

        location = clean_value(
            body.get("location")
        )

        # -------------------------------------------------
        # REQUIRED VALIDATION
        # -------------------------------------------------

        if not validate_item_type(item_type):

            return JsonResponse(
                {
                    "error":
                    "Item Type must be Lost or Found."
                },
                status=400
            )

        if not date_filing_raw:

            return JsonResponse(
                {
                    "error":
                    "Date Filing is required."
                },
                status=400
            )

        if not item:

            return JsonResponse(
                {
                    "error":
                    "Item name is required."
                },
                status=400
            )

        if not location:

            return JsonResponse(
                {
                    "error":
                    "Location is required."
                },
                status=400
            )

        # -------------------------------------------------
        # PARSE DATE FILING
        # -------------------------------------------------

        try:

            date_filing = parse_date(
                date_filing_raw
            )

        except ValueError as e:

            return JsonResponse(
                {
                    "error": str(e)
                },
                status=400
            )

        # -------------------------------------------------
        # PARSE DATE + TIME
        # -------------------------------------------------

        date_time = None

        if body.get("date_time"):

            try:

                date_time = parse_datetime(
                    body.get("date_time")
                )

            except ValueError as e:

                return JsonResponse(
                    {
                        "error": str(e)
                    },
                    status=400
                )

        # -------------------------------------------------
        # CLAIM STATUS
        # -------------------------------------------------

        claim_status = body.get(
            "claim_status",
            "Not Claimed"
        )

        if not validate_claim_status(
            claim_status
        ):

            return JsonResponse(
                {
                    "error":
                    "Invalid claim status."
                },
                status=400
            )

        # -------------------------------------------------
        # STATUS
        # -------------------------------------------------

        if claim_status == "Claimed":

            status = "Claimed"

        elif item_type == "Lost":

            status = "Not Found"

        else:

            status = "Found"

        # -------------------------------------------------
        # CONTACT
        # -------------------------------------------------

        contact = None

        if item_type == "Lost":

            contact = clean_value(
                body.get("contact")
            )

        # -------------------------------------------------
        # CLAIM INFORMATION
        # -------------------------------------------------

        claimant_name = None
        claimant_course = None
        date_claimed = None

        if claim_status == "Claimed":

            claimant_name = clean_value(
                body.get("claimant_name")
            )

            claimant_course = clean_value(
                body.get("claimant_course")
            )

            if body.get("date_claimed"):

                try:

                    date_claimed = parse_date(
                        body.get("date_claimed")
                    )

                except ValueError as e:

                    return JsonResponse(
                        {
                            "error": str(e)
                        },
                        status=400
                    )

        # -------------------------------------------------
        # CREATE
        # -------------------------------------------------

        record = LostFoundItem.objects.create(

            item_type=item_type,

            date_filing=date_filing,

            name=clean_value(
                body.get("name")
            ),

            year_course=clean_value(
                body.get("year_course")
            ),

            item=item,

            date_time=date_time,

            location=location,

            contact=contact,

            status=status,

            claim_status=claim_status,

            claimant_name=claimant_name,

            claimant_course=claimant_course,

            date_claimed=date_claimed,

            archived=False,

            archived_at=None,
        )

        return JsonResponse(
            serialize_record(record),
            status=201
        )

    # =====================================================
    # INVALID JSON
    # =====================================================

    except json.JSONDecodeError:

        return JsonResponse(
            {
                "error":
                "Invalid JSON request."
            },
            status=400
        )

    # =====================================================
    # DATABASE / UNKNOWN ERROR
    # =====================================================

    except Exception as e:

        print(
            "========================================"
        )

        print(
            "LOST & FOUND CREATE ERROR:"
        )

        print(
            repr(e)
        )

        print(
            "========================================"
        )

        return JsonResponse(
            {
                "error": str(e)
            },
            status=400
        )


# =========================================================
# DETAIL / UPDATE / DELETE
# =========================================================

@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def lost_found_detail(request, pk):

    # =====================================================
    # FIND RECORD
    # =====================================================

    try:

        record = LostFoundItem.objects.get(
            pk=pk
        )

    except LostFoundItem.DoesNotExist:

        return JsonResponse(
            {
                "error":
                "Lost & Found record not found."
            },
            status=404
        )

    # =====================================================
    # DELETE
    # =====================================================

    if request.method == "DELETE":

        try:

            record.delete()

            return JsonResponse(
                {
                    "message":
                    "Lost & Found record deleted successfully."
                },
                status=200
            )

        except Exception as e:

            print(
                "LOST & FOUND DELETE ERROR:",
                repr(e)
            )

            return JsonResponse(
                {
                    "error": str(e)
                },
                status=400
            )

    # =====================================================
    # PATCH
    # =====================================================

    try:

        body = json.loads(
            request.body or "{}"
        )

        # -------------------------------------------------
        # ARCHIVE / RESTORE
        # -------------------------------------------------

        if "archived" in body:

            should_archive = bool(
                body["archived"]
            )

            if should_archive:

                record.archived = True

                record.archived_at = (
                    timezone.now()
                )

            else:

                record.archived = False
                record.archived_at = None

        # -------------------------------------------------
        # ITEM TYPE
        # -------------------------------------------------

        if "item_type" in body:

            item_type = body[
                "item_type"
            ]

            if not validate_item_type(
                item_type
            ):

                return JsonResponse(
                    {
                        "error":
                        "Invalid item type."
                    },
                    status=400
                )

            record.item_type = item_type

        # -------------------------------------------------
        # DATE FILING
        # -------------------------------------------------

        if "date_filing" in body:

            value = body[
                "date_filing"
            ]

            if not value:

                return JsonResponse(
                    {
                        "error":
                        "Date Filing is required."
                    },
                    status=400
                )

            record.date_filing = parse_date(
                value
            )

        # -------------------------------------------------
        # NAME
        # -------------------------------------------------

        if "name" in body:

            record.name = clean_value(
                body["name"]
            )

        # -------------------------------------------------
        # YEAR / COURSE
        # -------------------------------------------------

        if "year_course" in body:

            record.year_course = clean_value(
                body["year_course"]
            )

        # -------------------------------------------------
        # ITEM
        # -------------------------------------------------

        if "item" in body:

            value = clean_value(
                body["item"]
            )

            if not value:

                return JsonResponse(
                    {
                        "error":
                        "Item name is required."
                    },
                    status=400
                )

            record.item = str(
                value
            ).strip()

        # -------------------------------------------------
        # LOCATION
        # -------------------------------------------------

        if "location" in body:

            value = clean_value(
                body["location"]
            )

            if not value:

                return JsonResponse(
                    {
                        "error":
                        "Location is required."
                    },
                    status=400
                )

            record.location = str(
                value
            ).strip()

        # -------------------------------------------------
        # CONTACT
        # -------------------------------------------------

        if "contact" in body:

            record.contact = clean_value(
                body["contact"]
            )

        # -------------------------------------------------
        # DATE + TIME
        # -------------------------------------------------

        if "date_time" in body:

            if body["date_time"]:

                record.date_time = parse_datetime(
                    body["date_time"]
                )

            else:

                record.date_time = None

        # -------------------------------------------------
        # STATUS
        # -------------------------------------------------

        if "status" in body:

            status = body[
                "status"
            ]

            if not validate_status(
                status
            ):

                return JsonResponse(
                    {
                        "error":
                        "Invalid status."
                    },
                    status=400
                )

            record.status = status

        # -------------------------------------------------
        # CLAIM STATUS
        # -------------------------------------------------

        if "claim_status" in body:

            claim_status = body[
                "claim_status"
            ]

            if not validate_claim_status(
                claim_status
            ):

                return JsonResponse(
                    {
                        "error":
                        "Invalid claim status."
                    },
                    status=400
                )

            record.claim_status = (
                claim_status
            )

        # -------------------------------------------------
        # CLAIMANT NAME
        # -------------------------------------------------

        if "claimant_name" in body:

            record.claimant_name = clean_value(
                body["claimant_name"]
            )

        # -------------------------------------------------
        # CLAIMANT COURSE
        # -------------------------------------------------

        if "claimant_course" in body:

            record.claimant_course = clean_value(
                body["claimant_course"]
            )

        # -------------------------------------------------
        # DATE CLAIMED
        # -------------------------------------------------

        if "date_claimed" in body:

            if body["date_claimed"]:

                record.date_claimed = parse_date(
                    body["date_claimed"]
                )

            else:

                record.date_claimed = None

        # -------------------------------------------------
        # KEEP CLAIM INFORMATION CONSISTENT
        # -------------------------------------------------

        if record.claim_status == "Claimed":

            record.status = "Claimed"

        else:

            record.claimant_name = None

            record.claimant_course = None

            record.date_claimed = None

            if record.item_type == "Lost":

                record.status = "Not Found"

            else:

                record.status = "Found"

        # -------------------------------------------------
        # SAVE
        # -------------------------------------------------

        record.save()

        return JsonResponse(
            serialize_record(record)
        )

    # =====================================================
    # INVALID JSON
    # =====================================================

    except json.JSONDecodeError:

        return JsonResponse(
            {
                "error":
                "Invalid JSON request."
            },
            status=400
        )

    # =====================================================
    # VALUE ERROR
    # =====================================================

    except ValueError as e:

        return JsonResponse(
            {
                "error": str(e)
            },
            status=400
        )

    # =====================================================
    # UNKNOWN ERROR
    # =====================================================

    except Exception as e:

        print(
            "========================================"
        )

        print(
            "LOST & FOUND UPDATE ERROR:"
        )

        print(
            repr(e)
        )

        print(
            "========================================"
        )

        return JsonResponse(
            {
                "error": str(e)
            },
            status=400
        )