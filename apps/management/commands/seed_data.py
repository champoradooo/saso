"""
python manage.py seed_data          # full seed (skips if data exists)
python manage.py seed_data --flush  # wipe everything first then seed
"""
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.students.models import Student, ClearanceRequirement, CounselingRecord
from apps.discipline.models import DisciplinaryCase
from apps.activities.models import Activity, ActivityParticipation

User = get_user_model()

# ── Filipino name pools ──────────────────────────────────────────────────────
FIRST_NAMES_F = [
    'Maria', 'Ana', 'Carla', 'Liza', 'Grace', 'Ella', 'Nina', 'Bianca',
    'Sofia', 'Diana', 'Patricia', 'Rowena', 'Cristina', 'Maricel', 'Jennilyn',
    'Charlene', 'Kathleen', 'Joanna', 'Rachel', 'Pamela', 'Yvonne', 'Sheila',
    'Loraine', 'Mariz', 'Denyvette', 'Ericka',
]
FIRST_NAMES_M = [
    'Jose', 'Juan', 'Carlo', 'Mark', 'Ryan', 'Aaron', 'Kevin', 'Jared',
    'Miguel', 'Luis', 'Charlie', 'John', 'Michael', 'Patrick', 'Adrian',
    'Renz', 'Aldrin', 'Gian', 'Joshua', 'Rafael', 'Christian', 'Lance',
    'Derick', 'Marvin', 'Phillip', 'Romeo',
]
LAST_NAMES = [
    'Santos', 'Reyes', 'Cruz', 'Garcia', 'Torres', 'Flores', 'Lopez', 'Ramos',
    'Mendoza', 'Bautista', 'Dela Cruz', 'Aquino', 'Villanueva', 'Castillo',
    'Gonzales', 'Diaz', 'Morales', 'Aguilar', 'Pascual', 'Soriano',
    'Magbanua', 'Bernardo', 'Navarro', 'Guevara', 'Salazar', 'Perez',
    'Domingo', 'Lacson', 'Vergara', 'Tolentino',
]
COURSES = ['BSIT', 'BSCS', 'BSBA', 'BSED', 'BSN', 'BSA', 'BSCRIM', 'BSHRM']
BARANGAYS = [
    'Brgy. Maharlika', 'Brgy. San Jose', 'Brgy. Kaybagal South',
    'Brgy. Kaybagal North', 'Brgy. Silang Junction', 'Brgy. Sungay East',
    'Brgy. Sungay West', 'Brgy. Aguinaldo', 'Brgy. Mendez Crossing',
    'Brgy. Asisan', 'Brgy. Francisco', 'Brgy. Iruhin Central',
]
STREETS = [
    'Maharlika Highway', 'National Road', 'Emilio Aguinaldo Highway',
    'Tagaytay-Nasugbu Highway', 'Calamba Road', 'Alfonso Road',
]
VIOLATIONS = [
    ('Tardiness',                    'minor',    'Verbal warning issued.'),
    ('Dress Code Violation',         'minor',    'Written warning and required to change attire.'),
    ('Use of Mobile Phone in Class', 'minor',    'Phone confiscated; returned after class.'),
    ('Cutting Classes',              'minor',    'Parents notified. Verbal warning.'),
    ('Littering',                    'minor',    'Community service (1 hour campus clean-up).'),
    ('Disrespect to Faculty',        'moderate', 'Written apology letter required. Parent conference.'),
    ('Vandalism',                    'moderate', 'Required to repair or pay for damages.'),
    ('Smoking on Campus',            'moderate', 'Suspension for 2 days. Parents notified.'),
    ('Possession of Alcohol',        'moderate', 'Items confiscated. 3-day suspension.'),
    ('Fighting / Physical Altercation', 'major', '5-day suspension. Required counseling sessions.'),
    ('Cheating / Academic Dishonesty',  'major', 'Grade of 0 for the exam. Probation period.'),
    ('Bullying',                     'major',    'Suspension. Mandatory counseling. Parents conference.'),
    ('Possession of Prohibited Items',  'major', 'Immediate suspension pending investigation.'),
    ('Theft',                        'major',    'Indefinite suspension pending admin hearing.'),
]
COUNSELING_NOTES = [
    'Student expressed difficulty in adjusting to college life. Advised to seek peer support.',
    'Discussed academic performance concerns. Set up a study schedule and follow-up session.',
    'Student reported family-related stress affecting concentration. Provided coping strategies.',
    'Addressed anger management concerns following disciplinary incident.',
    'Career guidance session. Explored student strengths and degree alignment.',
    'Follow-up session after disciplinary case. Student showing improvement in behavior.',
    'Student experiencing anxiety before major exams. Relaxation techniques discussed.',
    'Peer relationship conflict counseling. Mediation scheduled with involved parties.',
]
CLEARANCE_ITEMS = [
    'Library clearance',
    'Property and equipment clearance',
    'Finance/accounting clearance',
    'Organization adviser clearance',
    'Guidance office clearance',
    'Dormitory clearance',
    'Athletics clearance',
    'Registrar clearance',
]
ACTIVITIES_DATA = [
    ('SASO Orientation 2025',             'Annual orientation for new and returning students on SASO services and programs.',
     -180, 'OCT Gymnasium', 'SASO Office'),
    ('Leadership Training Seminar',       'A two-day seminar developing leadership skills among student organization officers.',
     -90, 'OCT Function Hall', 'Student Development Unit'),
    ('College Foundation Week',           'Week-long celebration of OCT\'s founding anniversary with cultural shows and sports.',
     -60, 'OCT Campus', 'SASO Office'),
    ('Mental Health Awareness Week',      'Activities promoting mental wellness including talks, art therapy, and free counseling.',
     -30, 'OCT Covered Court', 'Guidance Office'),
    ('Community Service Day',             'Students engage in community outreach and clean-up drive in Tagaytay City.',
     -15, 'Tagaytay City Hall Area', 'Civic Welfare Training Service'),
    ('Sports Fest 2025',                  'Inter-departmental sports competition featuring basketball, volleyball, and badminton.',
     -7, 'OCT Sports Complex', 'SASO Office'),
    ('Cultural Night 2025',              'A night of cultural performances showcasing Filipino heritage and student talents.',
     5, 'OCT Auditorium', 'Cultural Affairs Committee'),
    ('Anti-Bullying Awareness Campaign',  'Campaign activities including pledges, poster-making, and an awareness lecture.',
     14, 'OCT Gymnasium', 'Guidance Office'),
    ('Blood Letting Activity',            'Partnership with Philippine Red Cross for voluntary blood donation.',
     21, 'OCT Lobby', 'SASO & Red Cross'),
    ('Intramurals 2026',                  'Annual inter-college sports tournament.',
     30, 'OCT Sports Complex', 'SASO Office'),
    ('Organization Recognition Night',    'Recognition of accredited student organizations and their achievements.',
     45, 'OCT Function Hall', 'SASO Office'),
    ('Graduation Clearance Drive',        'Centralized clearance processing for graduating students.',
     60, 'SASO Office', 'SASO Office'),
    ('Mental Health Summit',              'Keynote talks and workshops on student mental health in higher education.',
     90, 'OCT Auditorium', 'Guidance Office'),
]


def rand_date_this_year(month=None):
    year = date.today().year
    if month:
        m = month
    else:
        m = random.randint(1, date.today().month)
    max_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
    d = random.randint(1, min(max_day, 28))
    return date(year, m, d)


class Command(BaseCommand):
    help = 'Seed the database with realistic sample data for all modules.'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Delete all existing data before seeding.')

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Flushing existing data…')
            ActivityParticipation.objects.all().delete()
            Activity.objects.all().delete()
            DisciplinaryCase.objects.all().delete()
            CounselingRecord.objects.all().delete()
            ClearanceRequirement.objects.all().delete()
            Student.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.WARNING('All data cleared.'))

        self._seed_users()
        students = self._seed_students()
        self._seed_clearance(students)
        self._seed_cases(students)
        self._seed_counseling(students)
        activities = self._seed_activities()
        self._seed_participation(students, activities)
        self.stdout.write(self.style.SUCCESS('\n✓ Database seeded successfully!\n'))

    # ── Users ────────────────────────────────────────────────────────────────
    def _seed_users(self):
        users = [
            ('admin', 'admin1234', 'admin', 'System', 'Administrator', 'admin@oct.edu.ph'),
            ('staff', 'staff1234', 'staff', 'Liza', 'Cruz', 'staff@oct.edu.ph'),
        ]
        for username, password, role, first, last, email in users:
            if not User.objects.filter(username=username).exists():
                if username == 'admin':
                    u = User.objects.create_superuser(username, email, password, role=role, first_name=first, last_name=last)
                else:
                    u = User.objects.create_user(username, email, password, role=role, first_name=first, last_name=last)
                self.stdout.write(f'  Created user: {username} / {password}')

    # ── Students ─────────────────────────────────────────────────────────────
    def _seed_students(self):
        if Student.objects.count() >= 50:
            self.stdout.write('  Students already seeded, skipping.')
            return list(Student.objects.all())

        students = []
        year = date.today().year
        for i in range(1, 61):
            gender = random.choice(['M', 'F'])
            first = random.choice(FIRST_NAMES_M if gender == 'M' else FIRST_NAMES_F)
            last  = random.choice(LAST_NAMES)
            sid   = f'OCT-{year}-{i:04d}'
            if Student.objects.filter(student_id=sid).exists():
                students.append(Student.objects.get(student_id=sid))
                continue
            course    = random.choice(COURSES)
            yr_level  = random.randint(1, 4)
            status    = random.choices(['completed', 'pending'], weights=[55, 45])[0]
            street    = random.choice(STREETS)
            barangay  = random.choice(BARANGAYS)
            address   = f'{random.randint(1, 999)} {street}, {barangay}, Tagaytay City, Cavite'
            email     = f'{first.lower()}.{last.lower().replace(" ", "")}{i}@student.oct.edu.ph'
            phone     = f'09{random.randint(100000000, 999999999)}'
            s = Student.objects.create(
                student_id=sid, first_name=first, last_name=last,
                middle_name=random.choice(LAST_NAMES[:10]),
                course=course, year_level=yr_level,
                address=address, email=email, phone=phone, status=status,
            )
            students.append(s)
        self.stdout.write(f'  Created {len(students)} students.')
        return students

    # ── Clearance requirements ────────────────────────────────────────────────
    def _seed_clearance(self, students):
        if ClearanceRequirement.objects.count() > 100:
            self.stdout.write('  Clearance already seeded, skipping.')
            return
        created = 0
        for student in students:
            items = random.sample(CLEARANCE_ITEMS, k=random.randint(4, 8))
            for item in items:
                done = student.status == 'completed' or random.random() > 0.4
                ClearanceRequirement.objects.get_or_create(
                    student=student, requirement=item,
                    defaults={'is_completed': done},
                )
                created += 1
        self.stdout.write(f'  Created {created} clearance requirement entries.')

    # ── Disciplinary cases ────────────────────────────────────────────────────
    def _seed_cases(self, students):
        if DisciplinaryCase.objects.count() >= 30:
            self.stdout.write('  Cases already seeded, skipping.')
            return
        statuses = ['pending', 'under_review', 'resolved']
        weights  = [30, 25, 45]
        created  = 0
        offenders = random.sample(students, k=min(35, len(students)))
        for student in offenders:
            n_cases = random.choices([1, 2, 3], weights=[65, 25, 10])[0]
            for _ in range(n_cases):
                violation, severity, sanction = random.choice(VIOLATIONS)
                month = random.randint(1, max(1, date.today().month))
                incident_date = rand_date_this_year(month)
                status = random.choices(statuses, weights=weights)[0]
                DisciplinaryCase.objects.create(
                    student=student,
                    incident_date=incident_date,
                    violation=violation,
                    description=f'Student {student.full_name} was reported for {violation.lower()} on {incident_date.strftime("%B %d, %Y")}. Incident was documented and forwarded to the SASO office for appropriate action.',
                    severity=severity,
                    status=status,
                    sanction=sanction if status in ('under_review', 'resolved') else '',
                )
                created += 1
        self.stdout.write(f'  Created {created} disciplinary cases.')

    # ── Counseling records ────────────────────────────────────────────────────
    def _seed_counseling(self, students):
        if CounselingRecord.objects.count() >= 20:
            self.stdout.write('  Counseling already seeded, skipping.')
            return
        created = 0
        counseled = random.sample(students, k=min(20, len(students)))
        for student in counseled:
            n = random.randint(1, 3)
            for j in range(n):
                session_date = rand_date_this_year()
                CounselingRecord.objects.create(
                    student=student,
                    session_date=session_date,
                    notes=random.choice(COUNSELING_NOTES),
                    next_session=session_date + timedelta(days=14) if random.random() > 0.5 else None,
                )
                created += 1
        self.stdout.write(f'  Created {created} counseling records.')

    # ── Activities ────────────────────────────────────────────────────────────
    def _seed_activities(self):
        if Activity.objects.count() >= len(ACTIVITIES_DATA):
            self.stdout.write('  Activities already seeded, skipping.')
            return list(Activity.objects.all())
        today = date.today()
        created = []
        for title, desc, days_offset, location, organizer in ACTIVITIES_DATA:
            a, new = Activity.objects.get_or_create(
                title=title,
                defaults=dict(
                    description=desc,
                    event_date=today + timedelta(days=days_offset),
                    end_date=today + timedelta(days=days_offset + random.randint(0, 2)),
                    location=location,
                    organizer=organizer,
                ),
            )
            if new:
                created.append(a)
        self.stdout.write(f'  Created {len(created)} activities.')
        return list(Activity.objects.all())

    # ── Activity participation ────────────────────────────────────────────────
    def _seed_participation(self, students, activities):
        if ActivityParticipation.objects.count() >= 50:
            self.stdout.write('  Participation already seeded, skipping.')
            return
        roles = ['Participant', 'Committee Member', 'Volunteer', 'Event Coordinator', 'Facilitator', '']
        created = 0
        for activity in activities:
            attendees = random.sample(students, k=random.randint(10, min(40, len(students))))
            for student in attendees:
                _, new = ActivityParticipation.objects.get_or_create(
                    student=student, activity=activity,
                    defaults={'role': random.choice(roles)},
                )
                if new:
                    created += 1
        self.stdout.write(f'  Created {created} participation records.')
