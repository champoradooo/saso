"""PDF generation helpers using ReportLab."""
from io import BytesIO
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

OCT_GREEN  = colors.HexColor('#2D6A2D')
OCT_LIGHT  = colors.HexColor('#EAF4EA')
GRAY_DARK  = colors.HexColor('#374151')
GRAY_MID   = colors.HexColor('#6B7280')
GRAY_LIGHT = colors.HexColor('#F3F4F6')
WHITE      = colors.white

SEVERITY_COLOR = {'minor': colors.HexColor('#F59E0B'), 'moderate': colors.HexColor('#F97316'), 'major': colors.HexColor('#EF4444')}
STATUS_COLOR   = {'pending': colors.HexColor('#F59E0B'), 'under_review': colors.HexColor('#3B82F6'), 'resolved': colors.HexColor('#10B981')}
STATUS_LABEL   = {'pending': 'Pending', 'under_review': 'Under Review', 'resolved': 'Resolved'}


def _base_doc(buffer, title):
    return SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
        title=title,
    )


def _styles():
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle('title', fontSize=16, textColor=OCT_GREEN, alignment=TA_CENTER, spaceAfter=2, fontName='Helvetica-Bold'),
        'subtitle': ParagraphStyle('subtitle', fontSize=9, textColor=GRAY_MID, alignment=TA_CENTER, spaceAfter=4),
        'section': ParagraphStyle('section', fontSize=10, textColor=OCT_GREEN, fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=4),
        'body': ParagraphStyle('body', fontSize=9, textColor=GRAY_DARK, spaceAfter=2),
        'right': ParagraphStyle('right', fontSize=8, textColor=GRAY_MID, alignment=TA_RIGHT),
    }


def _header(story, title, subtitle, styles):
    story.append(Paragraph('OLIVAREZ COLLEGE – TAGAYTAY', styles['title']))
    story.append(Paragraph('Student Affairs and Services Office (SASO)', styles['subtitle']))
    story.append(Paragraph(title, ParagraphStyle('h', fontSize=12, textColor=GRAY_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=2)))
    story.append(Paragraph(subtitle, styles['subtitle']))
    story.append(HRFlowable(width='100%', thickness=1.5, color=OCT_GREEN, spaceAfter=10))


def _table_style(col_widths, header_cols=None):
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), OCT_GREEN),
        ('TEXTCOLOR',  (0, 0), (-1, 0), WHITE),
        ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, 0), 8),
        ('FONTSIZE',   (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
        ('GRID',       (0, 0), (-1, -1), 0.4, colors.HexColor('#D1D5DB')),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
    ]
    return style


def generate_students_pdf(students):
    buffer = BytesIO()
    doc = _base_doc(buffer, 'Student Records Report')
    styles = _styles()
    story = []
    today = date.today().strftime('%B %d, %Y')
    total = len(students)
    completed = sum(1 for s in students if s.status == 'completed')
    pending = total - completed

    _header(story, 'Student Records Summary Report', f'Generated: {today}  |  Total: {total}  |  Completed: {completed}  |  Pending: {pending}', styles)

    headers = ['#', 'Student ID', 'Name', 'Course', 'Year', 'Email', 'Status']
    col_w   = [0.6*cm, 2.8*cm, 4.2*cm, 2*cm, 1.2*cm, 5*cm, 2*cm]
    rows = [headers]
    for i, s in enumerate(students, 1):
        rows.append([
            str(i),
            s.student_id,
            f'{s.last_name}, {s.first_name}',
            s.course,
            f'{s.year_level}',
            s.email or '—',
            'Completed' if s.status == 'completed' else 'Pending',
        ])

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    ts = _table_style(col_w)
    # color status column
    for i, s in enumerate(students, 1):
        c = colors.HexColor('#D1FAE5') if s.status == 'completed' else colors.HexColor('#FEF3C7')
        ts.append(('BACKGROUND', (6, i), (6, i), c))
    tbl.setStyle(TableStyle(ts))
    story.append(tbl)

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(f'Report generated on {today} by SASO Records Management System', styles['right']))
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_discipline_pdf(cases, filters=None):
    buffer = BytesIO()
    doc = _base_doc(buffer, 'Disciplinary Cases Report')
    styles = _styles()
    story = []
    today = date.today().strftime('%B %d, %Y')
    subtitle_parts = [f'Generated: {today}', f'Total Cases: {len(cases)}']
    if filters:
        subtitle_parts.append(filters)

    _header(story, 'Disciplinary Cases Report', '  |  '.join(subtitle_parts), styles)

    # Summary pills
    by_sev = {'minor': 0, 'moderate': 0, 'major': 0}
    by_sta = {'pending': 0, 'under_review': 0, 'resolved': 0}
    for c in cases:
        by_sev[c.severity] = by_sev.get(c.severity, 0) + 1
        by_sta[c.status]   = by_sta.get(c.status, 0) + 1

    summary_data = [
        ['Minor', 'Moderate', 'Major', 'Pending', 'Under Review', 'Resolved'],
        [str(by_sev['minor']), str(by_sev['moderate']), str(by_sev['major']),
         str(by_sta['pending']), str(by_sta['under_review']), str(by_sta['resolved'])],
    ]
    sum_tbl = Table(summary_data, colWidths=[2.8*cm]*6)
    sum_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (2, 0), colors.HexColor('#FEF3C7')),
        ('BACKGROUND', (3, 0), (5, 0), colors.HexColor('#EFF6FF')),
        ('FONTNAME',   (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, -1), 8),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('GRID',       (0, 0), (-1, -1), 0.4, colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(sum_tbl)
    story.append(Spacer(1, 0.4*cm))

    headers = ['Case #', 'Student', 'Violation', 'Severity', 'Status', 'Date']
    col_w   = [2*cm, 4*cm, 5*cm, 2*cm, 2.5*cm, 2.5*cm]
    rows = [headers]
    for c in cases:
        rows.append([
            c.case_number,
            f'{c.student.last_name}, {c.student.first_name}',
            c.violation,
            c.severity.capitalize(),
            STATUS_LABEL.get(c.status, c.status),
            c.incident_date.strftime('%b %d, %Y'),
        ])

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    ts = _table_style(col_w)
    for i, c in enumerate(cases, 1):
        sev_c = SEVERITY_COLOR.get(c.severity, colors.gray)
        ts.append(('TEXTCOLOR', (3, i), (3, i), sev_c))
        ts.append(('FONTNAME',  (3, i), (3, i), 'Helvetica-Bold'))
    tbl.setStyle(TableStyle(ts))
    story.append(tbl)

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(f'Report generated on {today} by SASO Records Management System', styles['right']))
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_activities_pdf(activities):
    buffer = BytesIO()
    doc = _base_doc(buffer, 'Activity Participation Log')
    styles = _styles()
    story = []
    today = date.today().strftime('%B %d, %Y')

    _header(story, 'Activity Participation Log', f'Generated: {today}  |  Total Activities: {len(activities)}', styles)

    for activity in activities:
        story.append(Paragraph(activity.title, styles['section']))
        info = [
            ['Date:', activity.event_date.strftime('%B %d, %Y'), 'Location:', activity.location or '—'],
            ['Organizer:', activity.organizer or '—', 'Participants:', str(activity.participations.count())],
        ]
        info_tbl = Table(info, colWidths=[2*cm, 6*cm, 2*cm, 6*cm])
        info_tbl.setStyle(TableStyle([
            ('FONTNAME',  (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME',  (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE',  (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), GRAY_MID),
            ('TEXTCOLOR', (2, 0), (2, -1), GRAY_MID),
        ]))
        story.append(info_tbl)

        participations = activity.participations.select_related('student').all()
        if participations:
            headers = ['#', 'Student ID', 'Name', 'Course', 'Year', 'Role']
            col_w = [0.6*cm, 2.8*cm, 4.5*cm, 2*cm, 1.2*cm, 5.9*cm]
            rows = [headers]
            for j, p in enumerate(participations, 1):
                rows.append([
                    str(j), p.student.student_id,
                    f'{p.student.last_name}, {p.student.first_name}',
                    p.student.course, f'{p.student.year_level}',
                    p.role or 'Participant',
                ])
            tbl = Table(rows, colWidths=col_w, repeatRows=1)
            tbl.setStyle(TableStyle(_table_style(col_w)))
            story.append(tbl)
        else:
            story.append(Paragraph('No participation records.', styles['body']))
        story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph(f'Report generated on {today} by SASO Records Management System', styles['right']))
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_performance_pdf(stats):
    buffer = BytesIO()
    doc = _base_doc(buffer, 'Office Performance Report')
    styles = _styles()
    story = []
    today = date.today().strftime('%B %d, %Y')

    _header(story, 'Office Performance Report', f'Generated: {today}  |  Academic Year {date.today().year}–{date.today().year + 1}', styles)

    story.append(Paragraph('Student Records Overview', styles['section']))
    s_data = [
        ['Metric', 'Count', 'Rate'],
        ['Total Enrolled Students', str(stats['students']['total']), '100%'],
        ['Clearance Completed', str(stats['students']['completed']),
         f"{round(stats['students']['completed'] / max(stats['students']['total'], 1) * 100)}%"],
        ['Clearance Pending', str(stats['students']['pending']),
         f"{round(stats['students']['pending'] / max(stats['students']['total'], 1) * 100)}%"],
    ]
    s_tbl = Table(s_data, colWidths=[9*cm, 3*cm, 4*cm])
    s_tbl.setStyle(TableStyle(_table_style([9*cm, 3*cm, 4*cm])))
    story.append(s_tbl)

    story.append(Paragraph('Disciplinary Cases Overview', styles['section']))
    c = stats['cases']
    res_rate = round(c['resolved'] / max(c['total'], 1) * 100)
    c_data = [
        ['Metric', 'Count', 'Rate'],
        ['Total Cases', str(c['total']), '100%'],
        ['Resolved', str(c['resolved']), f'{res_rate}%'],
        ['Pending', str(c['pending']), f"{round(c['pending'] / max(c['total'], 1) * 100)}%"],
        ['Under Review', str(c['under_review']), f"{round(c['under_review'] / max(c['total'], 1) * 100)}%"],
        ['Minor Cases', str(c['minor']), f"{round(c['minor'] / max(c['total'], 1) * 100)}%"],
        ['Moderate Cases', str(c['moderate']), f"{round(c['moderate'] / max(c['total'], 1) * 100)}%"],
        ['Major Cases', str(c['major']), f"{round(c['major'] / max(c['total'], 1) * 100)}%"],
    ]
    c_tbl = Table(c_data, colWidths=[9*cm, 3*cm, 4*cm])
    c_tbl.setStyle(TableStyle(_table_style([9*cm, 3*cm, 4*cm])))
    story.append(c_tbl)

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(f'Report generated on {today} by SASO Records Management System', styles['right']))
    doc.build(story)
    buffer.seek(0)
    return buffer

# =========================================================
# LOST & FOUND PDF REPORT
# =========================================================

def generate_lost_found_pdf(
    records,
    filters=None,
    selected_type='All',
    selected_year=None,
    selected_month=None,
    selected_period='Monthly',
    selected_semester='1st',
):
    buffer = BytesIO()

    doc = _base_doc(
        buffer,
        'Lost & Found Report'
    )

    styles = _styles()

    story = []

    today = date.today().strftime(
        '%B %d, %Y'
    )

    # -----------------------------------------------------
    # COUNTS
    # -----------------------------------------------------

    total = len(records)

    lost_count = sum(
        1
        for record in records
        if record.item_type == 'Lost'
    )

    found_count = sum(
        1
        for record in records
        if record.item_type == 'Found'
    )

    claimed_count = sum(
        1
        for record in records
        if record.claim_status == 'Claimed'
    )

    not_claimed_count = sum(
        1
        for record in records
        if record.claim_status != 'Claimed'
    )

    # -----------------------------------------------------
    # HEADER
    # -----------------------------------------------------

    subtitle_parts = [
        f'Generated: {today}',
        f'Total Records: {total}',
        f'Lost: {lost_count}',
        f'Found: {found_count}',
    ]

    if filters:
        subtitle_parts.append(
            filters
        )

    _header(
        story,
        'Lost & Found Report',
        '  |  '.join(subtitle_parts),
        styles
    )

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    story.append(
        Paragraph(
            'Summary',
            styles['section']
        )
    )

    summary_data = [
        [
            'Total Records',
            'Lost Items',
            'Found Items',
            'Claimed',
            'Not Claimed',
        ],
        [
            str(total),
            str(lost_count),
            str(found_count),
            str(claimed_count),
            str(not_claimed_count),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            3.1 * cm,
            3.1 * cm,
            3.1 * cm,
            3.1 * cm,
            3.1 * cm,
        ]
    )

    summary_table.setStyle(
        TableStyle([
            (
                'BACKGROUND',
                (0, 0),
                (-1, 0),
                colors.HexColor('#F3F4F6')
            ),
            (
                'FONTNAME',
                (0, 0),
                (-1, -1),
                'Helvetica-Bold'
            ),
            (
                'FONTSIZE',
                (0, 0),
                (-1, -1),
                8
            ),
            (
                'ALIGN',
                (0, 0),
                (-1, -1),
                'CENTER'
            ),
            (
                'GRID',
                (0, 0),
                (-1, -1),
                0.4,
                colors.HexColor('#D1D5DB')
            ),
            (
                'TOPPADDING',
                (0, 0),
                (-1, -1),
                6
            ),
            (
                'BOTTOMPADDING',
                (0, 0),
                (-1, -1),
                6
            ),
        ])
    )

    story.append(
        summary_table
    )

    story.append(
        Spacer(
            1,
            0.4 * cm
        )
    )

    # -----------------------------------------------------
    # RECORD TABLE
    # -----------------------------------------------------

    story.append(
        Paragraph(
            'Lost & Found Records',
            styles['section']
        )
    )

    headers = [
        '#',
        'Type',
        'Date Filing',
        'Name',
        'Item',
        'Location',
        'Status',
        'Claim',
    ]

    col_widths = [
        0.6 * cm,
        1.8 * cm,
        2.4 * cm,
        3.5 * cm,
        3.5 * cm,
        3.5 * cm,
        2.3 * cm,
        2.3 * cm,
    ]

    rows = [
        headers
    ]

    for index, record in enumerate(
        records,
        1
    ):

        date_filing = (
            record.date_filing.strftime(
                '%b %d, %Y'
            )
            if record.date_filing
            else '—'
        )

        rows.append([
            str(index),

            record.item_type or '—',

            date_filing,

            record.name or '—',

            record.item or '—',

            record.location or '—',

            record.status or '—',

            record.claim_status or '—',
        ])

    if len(rows) == 1:

        rows.append([
            '—',
            '—',
            '—',
            'No records',
            '—',
            '—',
            '—',
            '—',
        ])

    table = Table(
        rows,
        colWidths=col_widths,
        repeatRows=1
    )

    table_style = _table_style(
        col_widths
    )

    # -----------------------------------------------------
    # TYPE COLORS
    # -----------------------------------------------------

    for index, record in enumerate(
        records,
        1
    ):

        if record.item_type == 'Lost':

            table_style.append(
                (
                    'TEXTCOLOR',
                    (1, index),
                    (1, index),
                    colors.HexColor('#DC2626')
                )
            )

        elif record.item_type == 'Found':

            table_style.append(
                (
                    'TEXTCOLOR',
                    (1, index),
                    (1, index),
                    colors.HexColor('#16A34A')
                )
            )

        table_style.append(
            (
                'FONTNAME',
                (1, index),
                (1, index),
                'Helvetica-Bold'
            )
        )

    table.setStyle(
        TableStyle(
            table_style
        )
    )

    story.append(
        table
    )

    # -----------------------------------------------------
    # MONTHLY SUMMARY
    # -----------------------------------------------------

    if selected_year:

        story.append(
            Spacer(
                1,
                0.5 * cm
            )
        )

        story.append(
            Paragraph(
                'Monthly Summary',
                styles['section']
            )
        )

        month_names = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]

        monthly_data = [
            [
                'Month',
                'Total',
                'Lost',
                'Found',
            ]
        ]

        try:
            selected_year_int = int(
                selected_year
            )
        except (
            ValueError,
            TypeError
        ):
            selected_year_int = None

        if selected_year_int:

            for month_number, month_name in enumerate(
                month_names,
                1
            ):

                month_records = [
                    record
                    for record in records
                    if record.date_filing
                    and record.date_filing.year
                    == selected_year_int
                    and record.date_filing.month
                    == month_number
                ]

                month_lost = sum(
                    1
                    for record in month_records
                    if record.item_type == 'Lost'
                )

                month_found = sum(
                    1
                    for record in month_records
                    if record.item_type == 'Found'
                )

                monthly_data.append([
                    month_name,
                    str(len(month_records)),
                    str(month_lost),
                    str(month_found),
                ])

        monthly_table = Table(
            monthly_data,
            colWidths=[
                6 * cm,
                3 * cm,
                3 * cm,
                3 * cm,
            ],
            repeatRows=1
        )

        monthly_table.setStyle(
            TableStyle([
                (
                    'BACKGROUND',
                    (0, 0),
                    (-1, 0),
                    colors.HexColor('#F3F4F6')
                ),
                (
                    'FONTNAME',
                    (0, 0),
                    (-1, 0),
                    'Helvetica-Bold'
                ),
                (
                    'ALIGN',
                    (1, 1),
                    (-1, -1),
                    'CENTER'
                ),
                (
                    'GRID',
                    (0, 0),
                    (-1, -1),
                    0.4,
                    colors.HexColor('#D1D5DB')
                ),
                (
                    'ROWBACKGROUNDS',
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor('#F9FAFB')
                    ]
                ),
                (
                    'TOPPADDING',
                    (0, 0),
                    (-1, -1),
                    4
                ),
                (
                    'BOTTOMPADDING',
                    (0, 0),
                    (-1, -1),
                    4
                ),
            ])
        )

        story.append(
            monthly_table
        )

    # -----------------------------------------------------
    # FOOTER
    # -----------------------------------------------------

    story.append(
        Spacer(
            1,
            0.4 * cm
        )
    )

    story.append(
        Paragraph(
            'Report generated by SASO Records Management System',
            styles['right']
        )
    )

    doc.build(
        story
    )

    buffer.seek(0)

    return buffer