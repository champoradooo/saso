"""PDF generation helpers using ReportLab."""
from io import BytesIO
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable, Image,
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

# Usable content width on A4 with 1.5cm side margins
CONTENT_WIDTH = A4[0] - 3 * cm

_BASE_DIR = Path(__file__).resolve().parents[2]
_LOGO_CANDIDATES = [
    _BASE_DIR / "frontend" / "public",
    _BASE_DIR / "frontend" / "dist",
    _BASE_DIR / "static",
]


def _find_logo(filename):
    for folder in _LOGO_CANDIDATES:
        path = folder / filename
        if path.exists():
            return path
    return None


OCT_LOGO = _find_logo("oct-logo.png")
SASO_LOGO = _find_logo("saso-logo.jpg") or _find_logo("saso-logo.png")


def _base_doc(buffer, title):
    return SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        title=title,
    )


def _styles():
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle(
            'title',
            fontSize=13,
            leading=16,
            textColor=OCT_GREEN,
            alignment=TA_CENTER,
            spaceAfter=2,
            fontName='Helvetica-Bold',
        ),
        'subtitle': ParagraphStyle(
            'subtitle',
            fontSize=8,
            leading=11,
            textColor=GRAY_MID,
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        'section': ParagraphStyle(
            'section',
            fontSize=10,
            leading=13,
            textColor=OCT_GREEN,
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=4,
        ),
        'body': ParagraphStyle(
            'body',
            fontSize=9,
            leading=12,
            textColor=GRAY_DARK,
            spaceAfter=2,
        ),
        'right': ParagraphStyle(
            'right',
            fontSize=8,
            leading=10,
            textColor=GRAY_MID,
            alignment=TA_RIGHT,
        ),
        'cell': ParagraphStyle(
            'cell',
            fontSize=7,
            leading=9,
            textColor=GRAY_DARK,
            alignment=TA_LEFT,
        ),
        'cell_center': ParagraphStyle(
            'cell_center',
            fontSize=7,
            leading=9,
            textColor=GRAY_DARK,
            alignment=TA_CENTER,
        ),
        'cell_header': ParagraphStyle(
            'cell_header',
            fontSize=7,
            leading=9,
            textColor=WHITE,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
        ),
    }


def _escape(text):
    return (
        str(text if text is not None else "—")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _p(text, styles, style_key="cell"):
    return Paragraph(_escape(text), styles[style_key])


def _logo_image(path, size=1.8 * cm):
    if not path:
        return Spacer(size, size)
    try:
        return Image(str(path), width=size, height=size)
    except Exception:
        return Spacer(size, size)


def _header(story, title, subtitle, styles):
    left = _logo_image(OCT_LOGO)
    right = _logo_image(SASO_LOGO)

    center = [
        Paragraph("OLIVAREZ COLLEGE – TAGAYTAY", styles["title"]),
        Paragraph(
            "Student Affairs and Services Office (SASO)",
            styles["subtitle"],
        ),
        Paragraph(
            _escape(title),
            ParagraphStyle(
                "report_title",
                fontSize=11,
                leading=14,
                textColor=GRAY_DARK,
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
                spaceBefore=2,
                spaceAfter=2,
            ),
        ),
        Paragraph(_escape(subtitle), styles["subtitle"]),
    ]

    header_tbl = Table(
        [[left, center, right]],
        colWidths=[2.2 * cm, CONTENT_WIDTH - 4.4 * cm, 2.2 * cm],
    )
    header_tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (0, 0), "LEFT"),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
                ("ALIGN", (2, 0), (2, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(header_tbl)
    story.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=OCT_GREEN,
            spaceBefore=4,
            spaceAfter=10,
        )
    )


def _table_style(col_widths, header_cols=None):
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), OCT_GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("FONTSIZE", (0, 1), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
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
    col_w   = [0.7*cm, 2.4*cm, 3.4*cm, 2.2*cm, 1.1*cm, 4.4*cm, 2.1*cm]
    rows = [[_p(h, styles, 'cell_header') for h in headers]]
    for i, s in enumerate(students, 1):
        rows.append([
            _p(str(i), styles, 'cell_center'),
            _p(s.student_id, styles),
            _p(f'{s.last_name}, {s.first_name}', styles),
            _p(s.course, styles),
            _p(f'{s.year_level}', styles, 'cell_center'),
            _p(s.email or '—', styles),
            _p('Completed' if s.status == 'completed' else 'Pending', styles, 'cell_center'),
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

    sum_w = CONTENT_WIDTH / 6
    summary_data = [
        [_p(h, styles, 'cell_center') for h in
         ['Minor', 'Moderate', 'Major', 'Pending', 'Under Review', 'Resolved']],
        [_p(v, styles, 'cell_center') for v in
         [str(by_sev['minor']), str(by_sev['moderate']), str(by_sev['major']),
          str(by_sta['pending']), str(by_sta['under_review']), str(by_sta['resolved'])]],
    ]
    sum_tbl = Table(summary_data, colWidths=[sum_w] * 6)
    sum_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (2, 0), colors.HexColor('#FEF3C7')),
        ('BACKGROUND', (3, 0), (5, 0), colors.HexColor('#EFF6FF')),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID',       (0, 0), (-1, -1), 0.4, colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(sum_tbl)
    story.append(Spacer(1, 0.4*cm))

    headers = ['Case #', 'Student', 'Violation', 'Severity', 'Status', 'Date']
    col_w   = [2.2*cm, 3.0*cm, 5.0*cm, 1.8*cm, 2.2*cm, 2.1*cm]
    rows = [[_p(h, styles, 'cell_header') for h in headers]]
    for c in cases:
        rows.append([
            _p(c.case_number, styles),
            _p(f'{c.student.last_name}, {c.student.first_name}', styles),
            _p(c.violation, styles),
            _p(c.severity.capitalize(), styles, 'cell_center'),
            _p(STATUS_LABEL.get(c.status, c.status), styles, 'cell_center'),
            _p(c.incident_date.strftime('%b %d, %Y'), styles, 'cell_center'),
        ])

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    ts = _table_style(col_w)
    for i, c in enumerate(cases, 1):
        sev_c = SEVERITY_COLOR.get(c.severity, colors.gray)
        ts.append(('TEXTCOLOR', (3, i), (3, i), sev_c))
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
            col_w = [0.7*cm, 2.4*cm, 3.6*cm, 2.2*cm, 1.1*cm, 6.3*cm]
            rows = [[_p(h, styles, 'cell_header') for h in headers]]
            for j, p in enumerate(participations, 1):
                rows.append([
                    _p(str(j), styles, 'cell_center'),
                    _p(p.student.student_id, styles),
                    _p(f'{p.student.last_name}, {p.student.first_name}', styles),
                    _p(p.student.course, styles),
                    _p(f'{p.student.year_level}', styles, 'cell_center'),
                    _p(p.role or 'Participant', styles),
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
        1.5 * cm,
        2.1 * cm,
        2.8 * cm,
        2.8 * cm,
        2.8 * cm,
        2.0 * cm,
        2.0 * cm,
    ]

    rows = [
        [_p(h, styles, 'cell_header') for h in headers]
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
            _p(str(index), styles, 'cell_center'),
            _p(record.item_type or '—', styles, 'cell_center'),
            _p(date_filing, styles, 'cell_center'),
            _p(record.name or '—', styles),
            _p(record.item or '—', styles),
            _p(record.location or '—', styles),
            _p(record.status or '—', styles, 'cell_center'),
            _p(record.claim_status or '—', styles, 'cell_center'),
        ])

    if len(rows) == 1:

        rows.append([
            _p('—', styles, 'cell_center'),
            _p('—', styles, 'cell_center'),
            _p('—', styles, 'cell_center'),
            _p('No records', styles),
            _p('—', styles),
            _p('—', styles),
            _p('—', styles, 'cell_center'),
            _p('—', styles, 'cell_center'),
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