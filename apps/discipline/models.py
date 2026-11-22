from django.db import models
from django.utils import timezone

from apps.students.models import Student


class DisciplinaryCase(models.Model):

    # =====================================================
    # SEVERITY
    # =====================================================

    SEVERITY_MINOR = "minor"
    SEVERITY_MAJOR = "major"
    SEVERITY_GRAVE = "grave"

    SEVERITY_CHOICES = [
        (SEVERITY_MINOR, "Minor Offense"),
        (SEVERITY_MAJOR, "Major Offense"),
        (SEVERITY_GRAVE, "Grave Offense"),
    ]

    # =====================================================
    # STATUS
    # =====================================================

    STATUS_PENDING = "pending"
    STATUS_UNDER_REVIEW = "under_review"
    STATUS_RESOLVED = "resolved"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_UNDER_REVIEW, "Under Review"),
        (STATUS_RESOLVED, "Resolved"),
    ]

    # =====================================================
    # SANCTIONS
    # =====================================================

    SANCTION_CHOICES = [
        ("verbal_warning", "Verbal Warning"),
        ("written_warning", "Written Warning"),
        (
            "written_warning_probation",
            "Written Warning + Probation",
        ),
        ("community_service", "Community Service"),
        ("suspension", "Suspension"),
        (
            "suspension_with_probation",
            "Suspension with Probation",
        ),
        ("final_warning", "Final Warning"),
        ("dismissal", "Dismissal"),
        ("expulsion", "Expulsion"),
    ]

    # =====================================================
    # HANDBOOK VIOLATIONS
    # =====================================================

    MINOR_VIOLATIONS = [
        "Entering the campus without a school ID.",
        "Violating the rules on uniform whether in campus or off-campus activities.",
        "Wearing inappropriate and/or indecent attire on campus.",
        "Wearing of long/unkempt hair, earrings, make-up, outlandish hair style, hair color, or accessories, or not observing proper grooming among male students.",
        "Wearing of outlandish make-up, hair color and hair-do or not observing proper grooming among female students.",
        "Using foul and/or abusive language or expression.",
        "Loitering in the corridors during class hours.",
        "Disturbing a class or any school activity through boisterous conduct, howling, cheering or any action which tends to distract students from on-going activities, either in class or during convocations or assemblies.",
        "Creating boisterous noise in the classroom, library and other facilities.",
        "Littering in any part of the campus and/or along facilities.",
        "Smoking/Vaping in school uniform.",
        "Bringing or playing cards in school.",
        "Sleeping in class and creating disruptive noise.",
        "Running away from a person in authority to avoid apprehension.",
        "PDA - Cheek to cheek greeting between opposite sexes.",
        "PDA - Placing the hand around the shoulder or waist of the opposite sex.",
        "PDA - Placing the hand on the lap of the opposite sex.",
        "PDA - Reclining on the body of the opposite sex.",
        "Entering the campus in civilian clothes without securing the necessary approval for exemption in the case of working students.",
        "Other offenses that detriment peace and order of the school, unless properly classified as a major or grave offense.",
    ]

    MAJOR_VIOLATIONS = [
        "Repeated disregard of the norms of conduct and established policies and regulations of the school.",
        "Preventing other students from attending their classes or inciting them to violate school regulations.",
        "Lending one's ID to another student or outsider or using someone else's ID.",
        "Defaming or tarnishing the name/reputation of another student.",
        "PDA - Sitting/lying on the lap of the opposite sex.",
        "PDA - Embracing between opposite sex.",
        "PDA - Kissing lips-to-lips as part of their greetings.",
        "PDA - Massaging and/or maliciously touching any part of the body of the opposite sex.",
        "PDA - Holding/touching any sensitive part of the body of another person.",
        "PDA - Vulgar and indecent poses.",
        "Involvement in an activity outside school premises that could defame school image.",
        "Misuse of school or student club/organization funds and other graft and gross corruption practices.",
        "Giving or offering false testimony during official investigation.",
        "Posting or writing unapproved announcements or messages on the bulletin boards.",
        "Destroying/defacing school property such as writing, vandalism, etching indecent words or figures on chairs, blackboards, walls and other properties of the school.",
        "Unauthorized solicitation of donations in cash or in kind.",
        "Unauthorized use of the school facilities and properties.",
        "Fighting (of less nature).",
        "Writing degrading and obscene notes.",
        "Unauthorized alteration or erasure of official announcement.",
    ]

    GRAVE_VIOLATIONS = [
        "Dishonesty in any form during contests; cheating during examinations, placing oneself under suspicion during quiz or test and falsification of grades and school records.",
        "Carrying or possession of firearms and any kind of deadly weapon or destructive device within the premises of the campus.",
        "Unauthorized or illegal possession or use of prohibited and illegal drugs, chemicals or substances of any form within the campus premises or school-related activities in violation of RA 9165 or Comprehensive Dangerous Drugs Act.",
        "Willfully inflicting physical injuries upon others within the campus premises or school-related activities.",
        "Disgraceful or immoral conduct, indecency, lewdness or scandalous behavior during the campus and off-campus activities.",
        "Any act subjecting a person to physical injuries, whether actual or conspiracy, such as hazing or initiation that can be considered an affront to personal dignity.",
        "Plagiarism in writing research, term paper, assigned paperwork, or tampering of records through falsification or forgery, including excuse letters from parents or physicians.",
        "Bribery or giving/offering of anything to induce a person to do something illegal or wrong.",
        "Forging, intercalation, falsification of and tampering with academic or official records, receipts, permit or documents of any kind.",
        "Securing and using fake school receipts or admission documents.",
        "Attendance in classes without officially enrolling.",
        "Deceiving a teacher by taking a midterm/final examination but not passing the test paper.",
        "Taking examinations without examination permit.",
        "Committing serious acts of vandalism or destruction of school and teacher's property.",
        "Participation in any subversive activity.",
        "Final conviction by a court of law in a criminal case.",
        "Embezzlement/malversation of college/department, student organization or class funds.",
        "Formation of and/or membership in illegal organizations or those not officially accredited by the school.",
        "Any other act that is analogous to the aforementioned enumeration depending on the gravity of the case.",
        "Bullying of any form in violation of RA 10627 or Anti-Bullying Act.",
        "Serious fighting inside or outside the campus and/or acts causing public scandal, moral damage, physical injuries and damage to school property.",
        "Hazing or subjecting a person to physical or mental injury for the purpose of admission of membership in any organization in violation of RA 8049 or Anti-Hazing Law.",
        "Uploading a photo or video covering any sexual act or similar activity, such as naked or undergarment-clad genitals in violation of RA 9995 or Anti-Photo and Video Voyeurism Act.",
        "Willful affiliation/membership in a fraternity/sorority or any student organizations not recognized by Olivarez College Tagaytay, Inc.",
    ]

    ALL_VIOLATIONS = (
        MINOR_VIOLATIONS
        + MAJOR_VIOLATIONS
        + GRAVE_VIOLATIONS
    )

    # =====================================================
    # BASIC INFORMATION
    # =====================================================

    case_number = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        editable=False,
    )

    reason = models.CharField(
        max_length=255,
        blank=True,
    )

    # =====================================================
    # STUDENT
    # =====================================================

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="disciplinary_cases",
    )

    # =====================================================
    # OFFENSE NUMBER
    #
    # MANUAL / STORED VALUE
    # NO AUTOMATIC NUMBERING
    # =====================================================

    offense_number = models.PositiveIntegerField(
        default=1
    )

    # =====================================================
    # NARRATIVE REPORTS
    # =====================================================

    student_narrative = models.FileField(
        upload_to="discipline/student_reports/",
        blank=True,
        null=True,
    )

    reporter_narrative = models.FileField(
        upload_to="discipline/reporter_reports/",
        blank=True,
        null=True,
    )

    # =====================================================
    # INCIDENT INFORMATION
    # =====================================================

    incident_date = models.DateField()

    violation = models.CharField(
        max_length=500
    )

    description = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    sanction = models.CharField(
        max_length=40,
        choices=SANCTION_CHOICES,
        blank=True,
        null=True,
    )

    # =====================================================
    # TIMESTAMPS
    # =====================================================

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # =====================================================
    # META
    #
    # NEWEST CREATED CASE FIRST
    # =====================================================

    class Meta:
        ordering = [
            "-created_at",
            "-id",
        ]

    # =====================================================
    # AUTOMATIC SEVERITY
    # =====================================================

    @classmethod
    def get_severity_for_violation(cls, violation):

        if not violation:
            return cls.SEVERITY_MINOR

        violation = violation.strip()

        if violation in cls.MINOR_VIOLATIONS:
            return cls.SEVERITY_MINOR

        if violation in cls.MAJOR_VIOLATIONS:
            return cls.SEVERITY_MAJOR

        if violation in cls.GRAVE_VIOLATIONS:
            return cls.SEVERITY_GRAVE

        return cls.SEVERITY_MINOR

    # =====================================================
    # CASE NUMBER
    # Format: CASE-YYYY-8 (no zero padding)
    # =====================================================

    @classmethod
    def next_case_sequence(cls):
        year = timezone.now().year
        prefix = f"CASE-{year}-"

        existing = cls.objects.filter(
            case_number__startswith=prefix
        ).values_list("case_number", flat=True)

        max_n = 0
        for case_number in existing:
            suffix = case_number[len(prefix):]
            # Only count unpadded numbers (e.g. "7"), ignore
            # legacy zero-padded values like "0012".
            if suffix.isdigit() and (
                suffix == "0" or not suffix.startswith("0")
            ):
                max_n = max(max_n, int(suffix))

        return year, max_n + 1

    @classmethod
    def generate_case_number(cls):
        year, number = cls.next_case_sequence()
        return f"CASE-{year}-{number}"

    # =====================================================
    # SAVE
    # =====================================================

    def save(self, *args, **kwargs):

        if not self.case_number:
            year, number = self.next_case_sequence()

            for _ in range(50):
                candidate = f"CASE-{year}-{number}"
                if not DisciplinaryCase.objects.filter(
                    case_number=candidate
                ).exists():
                    self.case_number = candidate
                    break
                number += 1
            else:
                raise ValueError(
                    "Unable to generate a unique case number."
                )

        if self.violation:
            self.severity = (
                self.get_severity_for_violation(
                    self.violation
                )
            )

        super().save(*args, **kwargs)

    # =====================================================
    # STRING
    # =====================================================

    def __str__(self):
        return (
            f"{self.case_number} - "
            f"{self.student}"
        )