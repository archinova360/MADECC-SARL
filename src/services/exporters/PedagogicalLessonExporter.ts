import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { PedagogicalLessonExportModel } from '../../types/exportTypes.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Lesson').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class PedagogicalLessonExporter {
  /**
   * Export Pedagogical Lesson Plan to A4 PDF
   */
  public static async exportPDF(model: PedagogicalLessonExportModel): Promise<string> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 1. MINESEC / Educational Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(217, 119, 6); // amber accent bar
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('OFFICIAL PEDAGOGICAL LESSON PREPARATION PLAN', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`MINESEC Competency-Based Approach (CBA) Standard | Subject: ${model.subject || 'Civil Engineering'}`, 14, 22);
    doc.text(`Class Level: ${model.classLevel || 'Form 5 / 1ère F4'} | Duration: ${model.duration || '2 Hours (120 mins)'}`, 14, 27);

    let currentY = 40;

    // 2. Lesson Header Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Administrative & Curriculum Identification', 14, currentY);
    currentY += 5;

    const adminTable = [
      ['School / Institution', model.schoolName || 'Government Technical High School', 'Teacher Name', model.teacherName || 'Eng. Dieudonné Kemgne'],
      ['Subject / Module', model.subject || 'Civil Engineering & Building Tech', 'Class / Level', model.classLevel || 'Form 5 / 1ère F4'],
      ['Main Core Topic', model.topic || 'Reinforced Concrete Beam Calculation', 'Sub-Topic', model.subtopic || 'Bending Moment & Shear Stress'],
      ['Syllabus Unit', model.syllabusUnit || 'Unit 3: Structural Analysis', 'Duration', model.duration || '2 Hours (120 mins)'],
      ['Academic Term', `${model.term || 'Term 2'} (${model.academicYear || '2025/2026'})`, 'Lesson Number', `Lesson #${model.lessonNumber || 1}`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value', 'Field', 'Value']],
      body: adminTable,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. Competency-Based Approach (CBA) Objectives
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Competencies & Learning Objectives', 14, currentY);
    currentY += 5;

    if (model.cbaGoal) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(217, 119, 6);
      doc.text('CBA COMPETENCY GOAL:', 17, currentY + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(model.cbaGoal, 62, currentY + 6.5);
      currentY += 15;
    }

    if (model.prerequisites) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Prerequisite Knowledge:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(model.prerequisites, 55, currentY);
      currentY += 6;
    }

    if (model.teachingResources) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Teaching & Workshop Tools:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(model.teachingResources, 58, currentY);
      currentY += 8;
    }

    // 4. Lesson Development Stages Table
    const stages = model.developmentStages && model.developmentStages.length > 0
      ? model.developmentStages
      : [
          {
            stage: '1. Introduction & Hook',
            timeMinutes: '15 mins',
            teacherActivities: 'Review prior knowledge on concrete mixes. Present real-world beam failure case study.',
            learnerActivities: 'Answer diagnostic questions, observe failure diagram, state lesson objective.',
            resourcesUsed: 'Blackboard, Beam Sample, Projector',
            assessmentMethod: 'Oral questioning',
          },
          {
            stage: '2. Presentation of Core Concept',
            timeMinutes: '35 mins',
            teacherActivities: 'Derive neutral axis equations for rectangular RC beams under Eurocode 2.',
            learnerActivities: 'Take notes, draw stress-strain diagram, follow derivation steps.',
            resourcesUsed: 'Eurocode 2 Handout',
            assessmentMethod: 'Observation & Check for Understanding',
          },
          {
            stage: '3. Guided Practice & Exercise',
            timeMinutes: '45 mins',
            teacherActivities: 'Walk students through sample problem: Calculate required steel area Ast for 6m beam.',
            learnerActivities: 'Solve problem in groups of 3 using design chart. Present calculation at board.',
            resourcesUsed: 'Scientific Calculators, Design Charts',
            assessmentMethod: 'Formative group assessment',
          },
          {
            stage: '4. Evaluation & Homework',
            timeMinutes: '25 mins',
            teacherActivities: 'Assign 10-minute quiz. Summarize key takeaways and distribute homework assignment.',
            learnerActivities: 'Complete individual quiz, note homework deadline.',
            resourcesUsed: 'Printed Quiz Sheets',
            assessmentMethod: 'Individual Quiz Marking',
          },
        ];

    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Methodological Lesson Execution Matrix', 14, currentY);
    currentY += 4;

    const stageRows = stages.map((s) => [
      s.stage,
      String(s.timeMinutes),
      s.teacherActivities,
      s.learnerActivities,
      s.resourcesUsed,
      s.assessmentMethod,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Lesson Stage', 'Time', 'Teacher Activities', 'Learner Activities', 'Resources', 'Assessment']],
      body: stageRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 14 },
        2: { cellWidth: 48 },
        3: { cellWidth: 48 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 5. Scaffolding & Pedagogical Advice
    if (model.teacherCoachingAdvice) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Teacher Scaffolding & Pedagogical Coaching Notes', 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const splitCoach = doc.splitTextToSize(model.teacherCoachingAdvice, 182);
      doc.text(splitCoach, 14, currentY);
      currentY += splitCoach.length * 4.5 + 6;
    }

    // 6. Sign-off
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Pedagogical Approval', 14, currentY);
    currentY += 8;

    doc.rect(14, currentY, 85, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PREPARED BY TEACHER:', 17, currentY + 5);
    doc.text(model.teacherName || 'Eng. Dieudonné Kemgne', 17, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Date', 17, currentY + 18);

    doc.rect(111, currentY, 85, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INSPECTED BY HEAD OF DEPARTMENT:', 114, currentY + 5);
    doc.text('Pedagogical Inspector / HOD', 114, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Visa Stamp', 114, currentY + 18);

    // Page Numbering
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`MINESEC / MADECC Education | Lesson Ref: ${model.recordId} | Page ${i} of ${pageCount}`, 14, 287);
    }

    const filename = `MADECC_Pedagogical_Lesson_${sanitizeFilename(model.subject)}_${sanitizeFilename(model.topic)}_${model.recordId}.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Pedagogical Lesson Plan to Editable Word (.DOCX)
   */
  public static async exportDOCX(model: PedagogicalLessonExportModel): Promise<string> {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                bottom: 1000,
                left: 1000,
                right: 1000,
              },
            },
          },
          children: [
            new Paragraph({
              text: `PEDAGOGICAL LESSON PLAN — ${model.topic.toUpperCase()}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Subject: ${model.subject} | Class: ${model.classLevel} | Duration: ${model.duration}`,
                  italics: true,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            new Paragraph({ text: '1. Administrative Identification', heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subject:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.subject)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Class Level:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.classLevel)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Core Topic:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.topic)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Syllabus Unit:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.syllabusUnit)] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '2. Competency Objectives & Resources', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              children: [
                new TextRun({ text: 'CBA Goal: ', bold: true }),
                new TextRun({ text: model.cbaGoal || 'N/A' }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '3. Lesson Development Stages', heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Stage', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Time', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Teacher Activities', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Learner Activities', bold: true })] })] }),
                  ],
                }),
                ...(model.developmentStages || []).map(
                  (s) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph(s.stage)] }),
                        new TableCell({ children: [new Paragraph(String(s.timeMinutes))] }),
                        new TableCell({ children: [new Paragraph(s.teacherActivities)] }),
                        new TableCell({ children: [new Paragraph(s.learnerActivities)] }),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '4. Teacher Coaching & Scaffolding', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: model.teacherCoachingAdvice || 'N/A' }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Pedagogical_Lesson_${sanitizeFilename(model.subject)}_${sanitizeFilename(model.topic)}_${model.recordId}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
