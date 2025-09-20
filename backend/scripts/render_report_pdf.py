"""
Render an official PDF from a Markdown text body produced by generate_text_report.py

Usage:
    from render_report_pdf import render_report_pdf
    render_report_pdf(md_text, "Financial_Report.pdf",
                      company="Wellershoff Partners",
                      report_title="Aktuelle Markteinschätzung",
                      report_date="20.09.2025",
                      logo_path="WPlogo.png",
                      include_cover=True)
"""

from __future__ import annotations
import re
from typing import List, Optional, Tuple
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable,
    PageBreak, ListFlowable, ListItem, Table, TableStyle, KeepTogether
)

# =======================
# Styles
# =======================

def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        textColor=colors.black,
    ))

    styles.add(ParagraphStyle(
        name="H1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        spaceBefore=0,
        spaceAfter=10,
        textColor=colors.HexColor("#111111"),
        alignment=TA_LEFT,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="H2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        spaceBefore=14,
        spaceAfter=6,
        textColor=colors.HexColor("#111111"),
        alignment=TA_LEFT,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="H3",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        spaceBefore=10,
        spaceAfter=4,
        textColor=colors.HexColor("#222222"),
        alignment=TA_LEFT,
        keepWithNext=True,
    ))

    styles.add(ParagraphStyle(
        name="MetaRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#666666"),
        alignment=TA_RIGHT,
    ))
    styles.add(ParagraphStyle(
        name="SmallCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=colors.HexColor("#777777"),
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        name="Blockquote",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=10,
        leading=14,
        leftIndent=12,
        borderLeftColor=colors.HexColor("#CCCCCC"),
        borderLeftWidth=2,
        spaceBefore=6,
        spaceAfter=8,
        textColor=colors.HexColor("#333333"),
    ))

    styles.add(ParagraphStyle(
        name="TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#111111"),
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#222222"),
        alignment=TA_LEFT,
    ))

    styles.add(ParagraphStyle(
        name="LabelPara",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        spaceAfter=6,
        alignment=TA_LEFT,
    ))

    return styles

STYLES = _build_styles()

# =======================
# Inline markdown -> RL HTML
# =======================

_link_re = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
def _md_inline_to_html(text: str) -> str:
    """Convert a small subset of Markdown inline to ReportLab-friendly HTML."""
    if text is None:
        return ""

    # Escape
    text = (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;'))

    # Links
    text = _link_re.sub(r'<a href="\2">\1</a>', text)

    # Bold and italics
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)

    # Manual line breaks (two spaces + newline)
    text = text.replace('  \n', '<br/>')
    return text

# =======================
# Markdown block parsing
# =======================

_heading_re    = re.compile(r'^(#{1,3})\s+(.*)$')
_ul_re         = re.compile(r'^[-*]\s+(.+)$')
# Ordered lists: support "1. ", "1) ", "(1) ", and plain "1 "
_ol_std_re     = re.compile(r'^(?:\(?(\d+)\)?[.)])\s+(.+)$')
_ol_plain_re   = re.compile(r'^(\d+)\s+(.+)$')
_hr_re         = re.compile(r'^(\*{3,}|-{3,}|_{3,})\s*$')
_blockquote_re = re.compile(r'^\>\s?(.*)$')
_table_row_re  = re.compile(r'^\s*\|(.+)\|\s*$')
_table_sep_re  = re.compile(r'^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$')

# Treat these as label lines (bold prefix, no numbering)
_LABEL_WORDS = {"Exposition", "Maßnahmen", "Risiken", "Chancen"}
_label_line_re = re.compile(
    r'^\s*(?:\(?\d+\)?[.)]|\d+)?\s*(' + "|".join(_LABEL_WORDS) + r')\s*:\s*(.+)$',
    re.IGNORECASE
)

def _split_table_row(line: str) -> List[str]:
    inner = line.strip()
    if inner.startswith('|'):
        inner = inner[1:]
    if inner.endswith('|'):
        inner = inner[:-1]
    return [col.strip() for col in inner.split('|')]

def _collect_table(lines: List[str], start_idx: int) -> Tuple[Optional[dict], int]:
    i = start_idx
    if i >= len(lines):
        return None, start_idx

    m1 = _table_row_re.match(lines[i])
    sep = _table_sep_re.match(lines[i+1]) if i+1 < len(lines) else None

    if not (m1 and sep):
        return None, start_idx

    headers = _split_table_row(lines[i])
    i += 2

    rows: List[List[str]] = []
    while i < len(lines) and _table_row_re.match(lines[i]):
        rows.append(_split_table_row(lines[i]))
        i += 1

    return {"headers": headers, "rows": rows}, i

def _make_table_flowable(headers: List[str], rows: List[List[str]]) -> Table:
    data = [[Paragraph(_md_inline_to_html(h), STYLES["TableHeader"]) for h in headers]]
    for r in rows:
        cells = (r + [""] * len(headers))[:len(headers)]
        data.append([Paragraph(_md_inline_to_html(c), STYLES["TableCell"]) for c in cells])

    tbl = Table(data, hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F5F5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111111')),
        ('LINEBELOW', (0, 0), (-1, 0), 0.6, colors.HexColor('#CCCCCC')),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#DDDDDD')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    # Zebra rows
    for r in range(1, len(data)):
        if r % 2 == 0:
            tbl.setStyle(TableStyle([('BACKGROUND', (0, r), (-1, r), colors.HexColor('#FAFAFA'))]))
    return tbl

def _flush_paragraph(buffer_para: List[str], story: List):
    if buffer_para:
        para_text = " ".join(buffer_para).strip()
        if para_text:
            story.append(Paragraph(_md_inline_to_html(para_text), STYLES["Body"]))
        buffer_para.clear()

def _flush_list(list_items: List[str], list_type: Optional[str], story: List):
    if not list_items:
        return
    # bullet style:
    if list_type == "ul":
        # normal bullet list
        story.append(ListFlowable(
            [ListItem(Paragraph(_md_inline_to_html(it), STYLES["Body"]), leftIndent=10) for it in list_items],
            bulletType="bullet",
            leftIndent=12,
            spaceAfter=6
        ))
    elif list_type == "ol_dash":
        # ordered-source list rendered as dash bullets
        story.append(ListFlowable(
            [ListItem(Paragraph(_md_inline_to_html(it), STYLES["Body"]), leftIndent=10) for it in list_items],
            bulletType="bullet",
            bulletChar="-",
            leftIndent=12,
            spaceAfter=6
        ))
    else:
        # fallback
        story.append(ListFlowable(
            [ListItem(Paragraph(_md_inline_to_html(it), STYLES["Body"]), leftIndent=10) for it in list_items],
            bulletType="bullet",
            leftIndent=12,
            spaceAfter=6
        ))
    list_items.clear()

def _parse_markdown_to_flowables(md: str) -> List:
    """
    Parse Markdown into ReportLab flowables:
      - #, ##, ### headings
      - paragraphs
      - unordered lists
      - ordered lists → rendered as dash bullets ("-")
      - blockquotes
      - horizontal rules
      - tables (GitHub-style)
      - bold label lines (Exposition/Maßnahmen/Risiken/Chancen)
    """
    lines = md.replace('\r\n', '\n').strip().splitlines()
    story: List = []

    buffer_para: List[str] = []
    current_list_items: List[str] = []
    current_list_type: Optional[str] = None

    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        # TABLE
        table_info, next_i = _collect_table(lines, i)
        if table_info is not None:
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            story.append(Spacer(1, 4))
            story.append(_make_table_flowable(table_info["headers"], table_info["rows"]))
            story.append(Spacer(1, 6))
            i = next_i
            current_list_type = None
            continue

        # HEADING
        h = _heading_re.match(line)
        if h:
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            current_list_type = None
            level = len(h.group(1))
            text = h.group(2).strip()
            if level == 1:
                story.append(Paragraph(_md_inline_to_html(text), STYLES["H1"]))
                story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#DDDDDD")))
                story.append(Spacer(1, 6))
            elif level == 2:
                story.append(Paragraph(_md_inline_to_html(text), STYLES["H2"]))
            else:
                story.append(Paragraph(_md_inline_to_html(text), STYLES["H3"]))
            i += 1
            continue

        # HR
        if _hr_re.match(line):
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            current_list_type = None
            story.append(HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#CCCCCC")))
            story.append(Spacer(1, 6))
            i += 1
            continue

        # BLOCKQUOTE
        bq = _blockquote_re.match(line)
        if bq:
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            current_list_type = None
            story.append(Paragraph(_md_inline_to_html(bq.group(1).strip()), STYLES["Blockquote"]))
            i += 1
            continue

        # LABEL LINES
        lbl = _label_line_re.match(line)
        if lbl:
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            current_list_type = None
            label = lbl.group(1).strip().capitalize()
            content = lbl.group(2).strip()
            para_html = f"<b>{_md_inline_to_html(label)}:</b> {_md_inline_to_html(content)}"
            story.append(Paragraph(para_html, STYLES["LabelPara"]))
            i += 1
            continue

        # UL
        ul = _ul_re.match(line)
        if ul:
            _flush_paragraph(buffer_para, story)
            item_text = ul.group(1).strip()
            if current_list_type not in (None, "ul"):
                _flush_list(current_list_items, current_list_type, story)
            current_list_type = "ul"
            current_list_items.append(item_text)
            i += 1
            continue

        # OL (standard forms) -> dash bullets
        ol = _ol_std_re.match(line)
        if ol:
            _flush_paragraph(buffer_para, story)
            item_text = ol.group(2).strip()
            if current_list_type not in (None, "ol_dash"):
                _flush_list(current_list_items, current_list_type, story)
            current_list_type = "ol_dash"
            current_list_items.append(item_text)
            i += 1
            continue

        # OL (plain "1 " form) -> dash bullets
        olp = _ol_plain_re.match(line)
        if olp:
            _flush_paragraph(buffer_para, story)
            item_text = olp.group(2).strip()
            if current_list_type not in (None, "ol_dash"):
                _flush_list(current_list_items, current_list_type, story)
            current_list_type = "ol_dash"
            current_list_items.append(item_text)
            i += 1
            continue

        # BLANK
        if not line.strip():
            _flush_paragraph(buffer_para, story)
            _flush_list(current_list_items, current_list_type, story)
            current_list_type = None
            i += 1
            continue

        # Paragraph
        buffer_para.append(line)
        i += 1

    # leftovers
    _flush_paragraph(buffer_para, story)
    _flush_list(current_list_items, current_list_type, story)
    return story

# =======================
# Header / Footer
# =======================

def _page_decorator(company: str):
    def _draw(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#777777"))
        page_num = canvas.getPageNumber()
        canvas.drawRightString(A4[0] - 20*mm, 15*mm, str(page_num))
        canvas.drawString(20*mm, 15*mm, f"{company} | Vertraulich")
        canvas.restoreState()
    return _draw

# =======================
# Public API
# =======================

def render_report_pdf(
    md_text: str,
    output_filename: str,
    *,
    company: str = "Company",
    report_title: Optional[str] = None,
    report_date: Optional[str] = None,
    logo_path: Optional[str] = None,
    include_cover: bool = True,
) -> None:
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=25*mm,
        bottomMargin=25*mm,
    )

    story: List = []

    # Cover
    if include_cover:
        cover_bits: List = []
        if logo_path:
            try:
                logo = Image(logo_path, width=60, height=60)
                logo.hAlign = "RIGHT"
                cover_bits.append(logo)
            except Exception:
                pass

        if report_title:
            cover_bits.append(Paragraph(report_title, STYLES["H1"]))
        else:
            first_h1 = re.search(r'^\#\s+(.*)$', md_text, re.MULTILINE)
            cover_bits.append(Paragraph(first_h1.group(1).strip() if first_h1 else "Report", STYLES["H1"]))

        if report_date:
            cover_bits.append(Paragraph(report_date, STYLES["MetaRight"]))

        cover_bits.append(Spacer(1, 12))
        cover_bits.append(HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#CCCCCC")))
        cover_bits.append(Spacer(1, 30))
        cover_bits.append(Paragraph(company, STYLES["MetaRight"]))

        story.append(KeepTogether(cover_bits))
        story.append(PageBreak())

    # Body
    story.extend(_parse_markdown_to_flowables(md_text))

    # Disclaimer
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#DDDDDD")))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Disclaimer: Dieses Dokument dient ausschließlich Informationszwecken und stellt keine Anlageempfehlung dar.",
        STYLES["SmallCenter"]
    ))

    doc.build(story, onFirstPage=_page_decorator(company), onLaterPages=_page_decorator(company))


# =======================
# Example
# =======================

if __name__ == "__main__":
    demo_md = """# Kunden-Impakts & Maßnahmen

Musterkunde AG
- Hedging: 5% Gold. - Rebalancing: -5% USA Equities, +5% Govvies. - Stop-Loss: -5% unter Spot.
1 Exposition: Hohe Allokation in USA Equities (34.32%).
1 Maßnahmen: Prüfen von Staffelkäufen in Govvies.

Family Office Schmidt
- Hedging: 3% Gold. - Rebalancing: +5% EM.
(1) Exposition: Hohe Allokation in Global Government Bonds (20.62%).
(2) Maßnahmen: Taktisches Übergewicht EM-Aktien.

## Risiken & Unsicherheiten
1 Rechtliche Unsicherheiten bezüglich der MPLs.
2 Marktreaktionen auf politische/Umwelt-Themen.
3 Preisvolatilität bei Rohstoffen.

## Szenarien (Base / Bear / Bull)
| Szenario | Trigger | Portfolio-Tilt |
|----------|---------|----------------|
| Base     | Stabilisierung | Halten |
| Bear     | Negative Überraschung | +5% Anleihen |
| Bull     | Positive Entscheidung | +5% Rohstoffe |
"""
    render_report_pdf(
        demo_md,
        "Demo_Report.pdf",
        company="Wellershoff Partners",
        report_title="Aktuelle Markteinschätzung",
        report_date="20.09.2025",
        logo_path="WPlogo.png",
        include_cover=True
    )
