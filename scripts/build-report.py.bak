#!/usr/bin/env python3
"""
Build the AE2 dissertation report (.docx) from docs/report/REPORT.md on top of
the university template, keeping the template's title page, section breaks,
footers and table-of-contents control.

  python3 scripts/build-report.py

Output: docs/report/TradeMind_Academy_Dissertation.docx (and a copy in the
Dissertation folder). Open in Word and accept "update fields" so the contents
page and the figure/table lists pick up page numbers.
"""
from __future__ import annotations

import copy
import csv
import json
import re
import subprocess
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT.parent / "Assessment 70% brief" / "QHO656 AE2 Template.docx"
SOURCE = ROOT / "docs" / "report" / "REPORT.md"
OUT = ROOT / "docs" / "report" / "TradeMind_Academy_Dissertation.docx"
OUT_COPY = ROOT.parent / "TradeMind_Academy_Dissertation.docx"

TITLE = "TradeMind Academy: an intelligent tutoring system for trading education"
AUTHOR = "Ogechukwu Adama"
STUDENT_ID = "10440379"
DEGREE = "[Your degree title, e.g. BSc (Hons) Computer Science]"
YEAR = "2025/26"
SUBMISSION = "September 2026"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
TEXT_WIDTH_CM = 15.3

# ----------------------------------------------------------------------------
# Source parsing
# ----------------------------------------------------------------------------


def parse_blocks(text: str):
    """Yield (kind, payload) blocks from the report dialect."""
    lines = [l for l in text.split("\n") if not l.startswith("%%")]
    i = 0
    para: list[str] = []

    def flush():
        nonlocal para
        if para:
            yield ("para", " ".join(s.strip() for s in para))
            para = []

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if not s:
            yield from flush()
            i += 1
            continue
        if s.startswith("# "):
            yield from flush(); yield ("h1", s[2:].strip()); i += 1; continue
        if s.startswith("## "):
            yield from flush(); yield ("h2", s[3:].strip()); i += 1; continue
        if s.startswith("### "):
            yield from flush(); yield ("h3", s[4:].strip()); i += 1; continue
        if s == "[[PAGEBREAK]]":
            yield from flush(); yield ("pagebreak", None); i += 1; continue
        m = re.match(r"^\[\[([A-Z_]+)(?::(.+))?\]\]$", s)
        if m:
            yield from flush(); yield ("special", (m.group(1), m.group(2))); i += 1; continue
        m = re.match(r"^!\[(.*)\]\((.+)\)$", s)
        if m:
            yield from flush(); yield ("figure", (m.group(1), m.group(2))); i += 1; continue
        if s.startswith("Table: "):
            yield from flush()
            caption = s[7:].strip()
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.match(r"^:?-+:?$", c) for c in cells):
                    rows.append(cells)
                i += 1
            if rows:
                yield ("table", (caption, rows))
            else:
                yield ("table_placeholder", caption)
            continue
        if s.startswith("- "):
            yield from flush()
            items = []
            while i < len(lines) and lines[i].strip().startswith("- "):
                items.append(lines[i].strip()[2:]); i += 1
            yield ("bullets", items); continue
        if re.match(r"^\d+\. ", s):
            yield from flush()
            items = []
            while i < len(lines) and re.match(r"^\d+\. ", lines[i].strip()):
                items.append(re.sub(r"^\d+\. ", "", lines[i].strip())); i += 1
            yield ("numbered", items); continue
        para.append(line)
        i += 1
    yield from flush()


# ----------------------------------------------------------------------------
# docx helpers
# ----------------------------------------------------------------------------

INLINE = re.compile(r"(\*\*.+?\*\*|\*.+?\*|https?://\S+)")


def add_hyperlink(paragraph, url: str, text: str | None = None):
    part = paragraph.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    h = OxmlElement("w:hyperlink"); h.set(qn("r:id"), r_id)
    r = OxmlElement("w:r"); rpr = OxmlElement("w:rPr")
    c = OxmlElement("w:color"); c.set(qn("w:val"), "0563C1"); rpr.append(c)
    u = OxmlElement("w:u"); u.set(qn("w:val"), "single"); rpr.append(u)
    r.append(rpr)
    t = OxmlElement("w:t"); t.text = text or url; t.set(qn("xml:space"), "preserve"); r.append(t)
    h.append(r); paragraph._p.append(h)


def add_inline(paragraph, text: str):
    """Runs with **bold**, *italic* and clickable URLs."""
    for chunk in INLINE.split(text):
        if not chunk:
            continue
        if chunk.startswith("**") and chunk.endswith("**"):
            paragraph.add_run(chunk[2:-2]).bold = True
        elif chunk.startswith("*") and chunk.endswith("*") and len(chunk) > 2:
            paragraph.add_run(chunk[1:-1]).italic = True
        elif chunk.startswith("http"):
            trail = ""
            while chunk and chunk[-1] in ".,;)":
                trail = chunk[-1] + trail; chunk = chunk[:-1]
            add_hyperlink(paragraph, chunk)
            if trail:
                paragraph.add_run(trail)
        else:
            paragraph.add_run(chunk)


_bookmark_id = [100]


def add_bookmark(paragraph, name: str):
    _bookmark_id[0] += 1
    start = OxmlElement("w:bookmarkStart"); start.set(qn("w:id"), str(_bookmark_id[0])); start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd"); end.set(qn("w:id"), str(_bookmark_id[0]))
    pPr = paragraph._p.find(qn("w:pPr"))
    paragraph._p.insert(1 if pPr is not None else 0, start); paragraph._p.append(end)


def add_field(paragraph, instr: str, placeholder: str = ""):
    r1 = OxmlElement("w:r"); f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin"); r1.append(f1)
    r2 = OxmlElement("w:r"); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = f" {instr} "; r2.append(it)
    r3 = OxmlElement("w:r"); f3 = OxmlElement("w:fldChar"); f3.set(qn("w:fldCharType"), "separate"); r3.append(f3)
    r4 = OxmlElement("w:r"); t = OxmlElement("w:t"); t.text = placeholder; r4.append(t)
    r5 = OxmlElement("w:r"); f5 = OxmlElement("w:fldChar"); f5.set(qn("w:fldCharType"), "end"); r5.append(f5)
    for r in (r1, r2, r3, r4, r5):
        paragraph._p.append(r)


def set_cell_shading(cell, hex_fill: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hex_fill)
    tcPr.append(shd)


def set_table_borders(table):
    tbl = table._tbl; tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}"); el.set(qn("w:val"), "single"); el.set(qn("w:sz"), "4"); el.set(qn("w:space"), "0"); el.set(qn("w:color"), "999999")
        borders.append(el)
    later = [c for c in tblPr if c.tag in (qn("w:shd"), qn("w:tblLayout"), qn("w:tblCellMar"), qn("w:tblLook"), qn("w:tblCaption"), qn("w:tblDescription"))]
    if later:
        later[0].addprevious(borders)
    else:
        tblPr.append(borders)


class Builder:
    def __init__(self, doc: Document, anchor):
        """anchor: the XML element before which new content is inserted."""
        self.doc = doc
        self.anchor = anchor
        self.section_label = ""  # "1".."11" or "A".."J"
        self.fig_counts: dict[str, int] = {}
        self.tab_counts: dict[str, int] = {}
        self.figures: list[tuple[str, str, str]] = []  # (label, caption, bookmark)
        self.tables: list[tuple[str, str, str]] = []
        self.headings: list[tuple[int, str, str]] = []  # (level, text, bookmark)
        self.h_index = 0
        self.lof_anchor = None
        self.lot_anchor = None
        self.toc_entries_anchor = None

    # -- low-level insertion -------------------------------------------------
    def _insert(self, element):
        self.anchor.addprevious(element)

    def paragraph(self, style: str | None = None, text: str | None = None, align=None):
        p = self.doc.add_paragraph()  # appended at end; we move it
        self._insert(p._p)
        if style:
            try:
                p.style = self.doc.styles[style]
            except KeyError:
                pass
        if text is not None:
            add_inline(p, text)
        if align is not None:
            p.alignment = align
        return p

    # -- blocks --------------------------------------------------------------
    def heading(self, level: int, text: str):
        style = {1: "Heading 1", 2: "Heading 2", 3: "Heading 3"}[level]
        if level == 1:
            m = re.match(r"^(\d+)\.", text)
            if m:
                self.section_label = m.group(1)
            else:
                self.section_label = ""
        if level == 2:
            m = re.match(r"^Appendix ([A-Z]):", text)
            if m:
                self.section_label = m.group(1)
        p = self.paragraph(style, text)
        p.paragraph_format.keep_with_next = True
        _bookmark_id[0] += 1
        bm = f"_H{_bookmark_id[0]}"
        add_bookmark(p, bm)
        self.headings.append((level, text, bm))
        return p

    def body(self, text: str):
        return self.paragraph("Essay paragraph text", text)

    def bullets(self, items: list[str], numbered=False):
        for n, it in enumerate(items, 1):
            p = self.paragraph("Essay paragraph text")
            p.paragraph_format.left_indent = Cm(0.9)
            p.paragraph_format.first_line_indent = Cm(-0.6)
            p.paragraph_format.space_after = Pt(4)
            p.add_run(f"{n}.\t" if numbered else "•\t")
            add_inline(p, it)
        last = self.anchor.getprevious()
        # restore spacing after the list
        from docx.text.paragraph import Paragraph
        Paragraph(last, None).paragraph_format.space_after = Pt(12)

    def _label(self, kind: str) -> str:
        counts = self.fig_counts if kind == "Figure" else self.tab_counts
        key = self.section_label or "0"
        counts[key] = counts.get(key, 0) + 1
        return f"{key}.{counts[key]}" if self.section_label else ""

    def figure(self, caption: str, path: str):
        label = self._label("Figure")
        p = self.paragraph(None, align=WD_ALIGN_PARAGRAPH.CENTER)
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.space_before = Pt(6)
        run = p.add_run()
        img = ROOT / path
        from PIL import Image
        with Image.open(img) as im:
            w, h = im.size
        width_cm = min(TEXT_WIDTH_CM, 15.3)
        if h / w > 1.1:
            width_cm = 11.0
        run.add_picture(str(img), width=Cm(width_cm))
        cap = self.paragraph("Caption", align=WD_ALIGN_PARAGRAPH.CENTER)
        bm = f"_F{label.replace('.', '_')}" if label else f"_F{len(self.figures)}"
        add_bookmark(cap, bm)
        cap.add_run(f"Figure {label}: " if label else "Figure: ").bold = True
        cap.add_run(caption)
        self.figures.append((label, caption, bm))

    def table(self, caption: str | None, rows: list[list[str]], numbered=True, font_pt=9.5):
        label = self._label("Table") if (caption and numbered) else ""
        if caption:
            cap = self.paragraph("Caption")
            cap.paragraph_format.keep_with_next = True
            bm = f"_T{label.replace('.', '_')}" if label else f"_T{len(self.tables)}"
            add_bookmark(cap, bm)
            if label:
                cap.add_run(f"Table {label}: ").bold = True
                self.tables.append((label, caption, bm))
            cap.add_run(caption)
        ncols = max(len(r) for r in rows)
        t = self.doc.add_table(rows=len(rows), cols=ncols)
        self._insert(t._tbl)
        set_table_borders(t)
        t.autofit = True
        for ri, row in enumerate(rows):
            for ci in range(ncols):
                cell = t.cell(ri, ci)
                txt = row[ci] if ci < len(row) else ""
                cell.text = ""
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                add_inline(p, txt)
                for r in p.runs:
                    r.font.size = Pt(font_pt)
                    r.font.name = "Trebuchet MS"
                    if ri == 0:
                        r.font.bold = True
                if ri == 0:
                    set_cell_shading(cell, "E8EAF2")
        # tail spacing
        self.paragraph(None).paragraph_format.space_after = Pt(6)

    def code(self, text: str, font_pt=8):
        for line in text.rstrip("\n").split("\n"):
            p = self.paragraph(None)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(line if line.strip() else " ")
            r.font.name = "Courier New"; r.font.size = Pt(font_pt)
        self.paragraph(None).paragraph_format.space_after = Pt(6)

    def page_break(self):
        p = self.paragraph(None)
        r = p.add_run(); br = OxmlElement("w:br"); br.set(qn("w:type"), "page"); r._r.append(br)

    def list_entry(self, style_id: str, text: str, bookmark: str):
        p = self.paragraph(None)
        # apply style by id (TOC1/TOC2/TableofFigures exist by id, not name)
        pPr = p._p.get_or_add_pPr(); ps = OxmlElement("w:pStyle"); ps.set(qn("w:val"), style_id); pPr.insert(0, ps)
        tabs = OxmlElement("w:tabs"); tab = OxmlElement("w:tab"); tab.set(qn("w:val"), "right"); tab.set(qn("w:leader"), "dot"); tab.set(qn("w:pos"), "8630"); tabs.append(tab); pPr.append(tabs)
        p.add_run(text)
        p.add_run("\t")
        add_field(p, f"PAGEREF {bookmark} \\h", "")
        return p


# ----------------------------------------------------------------------------
# Special content generators
# ----------------------------------------------------------------------------


def curriculum_rows() -> list[list[str]]:
    data = json.loads((ROOT / "content" / "level1.json").read_text())
    kc_title = {k["id"]: k["title"] for k in data["kcs"]}
    order = [k["id"] for k in data["kcs"]]
    # lesson id -> video and duration from markdown headers
    meta = {}
    for md in sorted((ROOT / "content" / "lessons").glob("*.md")):
        text = md.read_text()
        m = re.search(r"Video: `([^`]+)` \(([\d:]+)\)", text)
        title = re.match(r"# (.+)", text).group(1) if re.match(r"# (.+)", text) else md.stem
        meta[md.stem] = (title, m.group(1) if m else "", m.group(2) if m else "")
    rows = [["Module", "Lesson", "Source video", "Length"]]
    for kc in order:
        lessons = [l for l in data["lessons"] if l["kcId"] == kc]
        for l in lessons:
            stem = l.get("sourceFile") or l["id"]
            title, video, dur = meta.get(stem, (l.get("title", l["id"]), "", ""))
            if not video:
                # try by matching title in markdown files
                for k, (t, v, d) in meta.items():
                    if t.split("—")[-1].strip().lower() == l.get("title", "").lower():
                        title, video, dur = t, v, d
                        break
            rows.append([kc_title[kc], l.get("title", title), video.replace("_", " ").replace(".mp4", ""), dur])
    return rows


def simulation_output() -> str:
    res = subprocess.run(["npx", "tsx", "scripts/simulate.ts"], cwd=ROOT, capture_output=True, text=True)
    return res.stdout


def decisions_rows() -> list[list[str]]:
    rows = [["Date", "Decision"]]
    for line in (ROOT / "docs" / "DECISIONS.md").read_text().split("\n"):
        m = re.match(r"^- (\d{4}-\d{2}-\d{2}) · (.+)$", line)
        if m:
            rows.append([m.group(1), re.sub(r"`", "", m.group(2))])
    return rows


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------


def set_textbox_lines(doc, lines: list[str]):
    """Replace the four placeholder lines in both copies of the title text box."""
    body = doc.element.body
    for txbx in body.iter(f"{{{W}}}txbxContent"):
        paras = [p for p in txbx.iter(f"{{{W}}}p")]
        # placeholder paragraphs are the ones with text
        texted = [p for p in paras if "".join(t.text or "" for t in p.iter(f"{{{W}}}t")).strip()]
        for p, new in zip(texted, lines):
            ts = list(p.iter(f"{{{W}}}t"))
            ts[0].text = new
            for t in ts[1:]:
                t.text = ""


def body_word_count() -> int:
    """Words in Chapters 1 to 8, excluding tables, captions and figure lines."""
    n = 0; in_body = False
    for line in SOURCE.read_text().split("\n"):
        if line.startswith("%%"):
            continue
        if line.startswith("# "):
            in_body = bool(re.match(r"^# [1-8]\.", line))
            continue
        if not in_body or line.startswith("|") or line.startswith("![") or line.startswith("[[") or line.startswith("Table:"):
            continue
        n += len(re.findall(r"\S+", line))
    return n


def main():
    doc = Document(str(TEMPLATE))
    body = doc.element.body
    kids = list(body.iterchildren())

    # --- title page -----------------------------------------------------------
    set_textbox_lines(doc, [DEGREE, f"Academic year {YEAR}", f"{AUTHOR} ({STUDENT_ID})", TITLE])
    for p in doc.paragraphs:
        if p.text.startswith("Date of submission"):
            for r in p.runs:
                r.text = r.text.replace("September", SUBMISSION)
            wc_p = copy.deepcopy(p._p)
            p._p.addnext(wc_p)
            from docx.text.paragraph import Paragraph
            wp = Paragraph(wc_p, p._parent)
            for r in wp.runs[1:]:
                r.text = ""
            wp.runs[0].text = f"Word count\t:\t{body_word_count():,} (main body, Chapters 1 to 8, excluding tables, figures, references and appendices)"

    # --- locate anchors in the template ----------------------------------------
    def para_text(el):
        return "".join(t.text or "" for t in el.iter(f"{{{W}}}t")).strip()

    idx_ack = next(i for i, k in enumerate(kids) if para_text(k) == "Acknowledgements")
    idx_sect2 = next(i for i, k in enumerate(kids) if i > idx_ack and k.find(f".//{{{W}}}sectPr") is not None)
    idx_toc = next(i for i, k in enumerate(kids) if k.tag == f"{{{W}}}sdt")
    idx_sect3 = next(i for i, k in enumerate(kids) if i > idx_toc and k.find(f".//{{{W}}}sectPr") is not None)
    idx_sect4 = next(i for i, k in enumerate(kids) if i > idx_sect3 and k.find(f".//{{{W}}}sectPr") is not None)
    final_sectPr = body.find(f"{{{W}}}sectPr")

    # appendices section: reuse section 4's properties as the document's last section
    app_sectPr = copy.deepcopy(kids[idx_sect4].find(f".//{{{W}}}sectPr"))
    body.replace(final_sectPr, app_sectPr)

    # remove template placeholder content
    for k in kids[idx_ack:idx_sect2]:
        body.remove(k)
    for k in kids[idx_toc + 1:idx_sect3]:
        body.remove(k)
    for k in kids[idx_sect4:]:
        if k.tag != f"{{{W}}}sectPr":
            body.remove(k)

    sect2 = kids[idx_sect2]; sect3 = kids[idx_sect3]; toc_sdt = kids[idx_toc]

    # --- parse and route blocks ------------------------------------------------
    blocks = list(parse_blocks(SOURCE.read_text()))
    front = Builder(doc, sect2)
    main_b = Builder(doc, sect3)
    app_b = Builder(doc, app_sectPr)

    # front matter: Acknowledgements, Acronyms, Abstract go before sect2; lists + chapters before sect3; appendices before final
    current = front
    lof_marker = lot_marker = None
    for kind, payload in blocks:
        if kind == "h1":
            if payload in ("List of Figures", "List of Tables"):
                current = main_b
                current.heading(1, payload)
                marker = current.paragraph(None)
                if payload == "List of Figures":
                    lof_marker = marker
                else:
                    lot_marker = marker
                continue
            if re.match(r"^\d+\.", payload):
                num = int(payload.split(".")[0])
                current = app_b if num >= 11 else main_b
            current.heading(1, payload)
            continue
        if kind == "h2":
            current.heading(2, payload); continue
        if kind == "h3":
            current.heading(3, payload); continue
        if kind == "para":
            if current is main_b and main_b.section_label in ("9", "10"):
                current.paragraph("Essay Bibliography text", payload)
            else:
                current.body(payload)
            continue
        if kind == "bullets":
            current.bullets(payload); continue
        if kind == "numbered":
            current.bullets(payload, numbered=True); continue
        if kind == "figure":
            cap, path = payload; current.figure(cap, path); continue
        if kind == "table":
            cap, rows = payload
            current.table(cap, rows, numbered=bool(current.section_label))
            continue
        if kind == "table_placeholder":
            current._pending_caption = payload; continue
        if kind == "pagebreak":
            if current is front:
                continue  # section break already separates front matter
            current.page_break(); continue
        if kind == "special":
            name, arg = payload
            if name == "CODE":
                current.code((ROOT / arg).read_text())
            elif name == "CURRICULUM_TABLE":
                current.table(getattr(current, "_pending_caption", "Lessons by module"), curriculum_rows(), font_pt=8.5)
            elif name == "SIMULATION_OUTPUT":
                current.code(simulation_output(), font_pt=7.5)
            elif name == "DECISIONS_LOG":
                current.table("Decisions log", decisions_rows(), font_pt=8)
            continue

    # --- lists of figures and tables --------------------------------------------
    all_figs = main_b.figures + app_b.figures
    all_tabs = main_b.tables + app_b.tables
    lof = Builder(doc, lof_marker._p)
    for label, cap, bm in all_figs:
        lof.list_entry("TableofFigures", f"Figure {label}: {cap}", bm)
    lot = Builder(doc, lot_marker._p)
    for label, cap, bm in all_tabs:
        lot.list_entry("TableofFigures", f"Table {label}: {cap}", bm)
    lof_marker._p.getparent().remove(lof_marker._p)
    lot_marker._p.getparent().remove(lot_marker._p)

    # --- contents: replace the cached TOC entries inside the sdt -----------------
    sdt_content = toc_sdt.find(f"{{{W}}}sdtContent")
    cached = list(sdt_content.iterchildren())
    for c in cached[1:]:  # keep the "Table of Contents" title paragraph only
        sdt_content.remove(c)
    entries = [(lvl, txt, bm) for b in (front, main_b, app_b) for (lvl, txt, bm) in b.headings if lvl <= 2 and txt not in ("List of Figures", "List of Tables")]
    for n, (lvl, txt, bm) in enumerate(entries):
        p = doc.add_paragraph()
        pPr = p._p.get_or_add_pPr(); ps = OxmlElement("w:pStyle"); ps.set(qn("w:val"), "TOC1" if lvl == 1 else "TOC2"); pPr.insert(0, ps)
        tabs = OxmlElement("w:tabs"); tab = OxmlElement("w:tab"); tab.set(qn("w:val"), "right"); tab.set(qn("w:leader"), "dot"); tab.set(qn("w:pos"), "8630"); tabs.append(tab); pPr.append(tabs)
        if n == 0:
            # the TOC field itself opens inside the first entry, as Word writes it
            r1 = OxmlElement("w:r"); f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin"); r1.append(f1)
            r2 = OxmlElement("w:r"); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = ' TOC \\o "1-2" \\h \\z \\u '; r2.append(it)
            r3 = OxmlElement("w:r"); f3 = OxmlElement("w:fldChar"); f3.set(qn("w:fldCharType"), "separate"); r3.append(f3)
            for r in (r1, r2, r3):
                p._p.append(r)
        p.add_run(txt); p.add_run("\t"); add_field(p, f"PAGEREF {bm} \\h", "")
        sdt_content.append(p._p)
    pend = doc.add_paragraph(); r = OxmlElement("w:r"); f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), "end"); r.append(f); pend._p.append(r)
    sdt_content.append(pend._p)

    # --- ask Word to refresh fields on open ------------------------------------
    settings = doc.settings.element
    uf = OxmlElement("w:updateFields"); uf.set(qn("w:val"), "true")
    after = [c for c in settings if c.tag in (qn("w:hdrShapeDefaults"), qn("w:footnotePr"), qn("w:endnotePr"), qn("w:compat"), qn("w:docVars"), qn("w:rsids"), qn("m:mathPr"), qn("w:themeFontLang"), qn("w:clrSchemeMapping"), qn("w:shapeDefaults"), qn("w:decimalSymbol"), qn("w:listSeparator"))]
    if after:
        after[0].addprevious(uf)
    else:
        settings.append(uf)

    # --- word count line on the title page -------------------------------------
    doc.save(str(OUT))
    OUT_COPY.write_bytes(OUT.read_bytes())
    print(f"written {OUT}\n copied {OUT_COPY}")
    print(f"figures {len(all_figs)} tables {len(all_tabs)} headings {len(entries)}")


if __name__ == "__main__":
    main()
