'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ServiceOrder, OrderItem } from './supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BRAND_DARK = '#1a2332'
const BRAND_GREEN = '#4ade80'
const BRAND_BLUE = '#38bdf8'

export function generateLaudoPDF(order: ServiceOrder, items: OrderItem[], clientName: string) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = 15

  // ============ HEADER ============
  // Dark background header
  doc.setFillColor(26, 35, 50)
  doc.rect(margin, y, contentWidth, 22, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Eco Tech', margin + 8, y + 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('236.094.03/0001-38', margin + 8, y + 18)

  // Badge "LAUDO TÉCNICO & ORÇAMENTO"
  const badgeWidth = 52
  const badgeX = pageWidth - margin - badgeWidth - 3
  doc.setFillColor(56, 189, 248)
  doc.roundedRect(badgeX, y + 4, badgeWidth, 14, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('LAUDO TÉCNICO', badgeX + badgeWidth / 2, y + 10, { align: 'center' })
  doc.text('& ORÇAMENTO', badgeX + badgeWidth / 2, y + 15, { align: 'center' })

  y += 26

  // Address & Equipment bar
  doc.setFillColor(240, 244, 248)
  doc.rect(margin, y, contentWidth, 14, 'F')
  doc.setDrawColor(200, 210, 220)
  doc.rect(margin, y, contentWidth, 14, 'S')

  doc.setTextColor(80, 90, 100)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('ENDEREÇO DA OFICINA', margin + 4, y + 4)
  doc.text('EQUIPAMENTO / VEÍCULO', margin + contentWidth / 2 + 4, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(40, 50, 60)
  doc.text('R. Venâncio Aires, 1385 - Santo Antônio,', margin + 4, y + 8.5)
  doc.text('Uruguaiana - RS, 97502-145', margin + 4, y + 12)

  const equipText = [order.equipment, order.brand, order.model].filter(Boolean).join(' - ')
  doc.text(equipText || '', margin + contentWidth / 2 + 4, y + 8.5)
  if (order.serial_number) {
    doc.text(`S/N: ${order.serial_number}`, margin + contentWidth / 2 + 4, y + 12)
  }

  // Vertical divider
  doc.setDrawColor(200, 210, 220)
  doc.line(margin + contentWidth / 2, y, margin + contentWidth / 2, y + 14)

  y += 19

  // OS Number and Date line
  doc.setFontSize(8)
  doc.setTextColor(100, 110, 120)
  doc.text(`OS nº ${String(order.order_number).padStart(4, '0')}`, margin, y)
  doc.text(`Data: ${format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}`, margin + 40, y)
  doc.text(`Cliente: ${clientName}`, margin + 90, y)

  y += 7

  // ============ SECTION 1: RELATO DO SINTOMA ============
  y = drawSection(doc, '1. RELATO DO SINTOMA / ENTRADA', order.symptom_report || '', margin, y, contentWidth)

  // ============ SECTION 2: DIAGNÓSTICO TÉCNICO ============
  y = drawSection(doc, '2. DIAGNÓSTICO TÉCNICO DE BANCADA', order.technical_diagnosis || '', margin, y, contentWidth)

  // ============ SECTION 3: SERVIÇOS E PEÇAS ============
  y += 2
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 40, 50)
  doc.text('3. DESCRIÇÃO DOS SERVIÇOS E PEÇAS', margin, y)
  y += 1

  // Green-blue gradient line
  doc.setDrawColor(74, 222, 128)
  doc.setLineWidth(1)
  doc.line(margin, y, margin + contentWidth * 0.3, y)
  doc.setDrawColor(56, 189, 248)
  doc.line(margin + contentWidth * 0.3, y, margin + contentWidth, y)

  y += 3

  if (items.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Item', 'Descrição do Serviço / Componente', 'Qtd', 'Valor Unit.', 'Total']],
      body: items.map((item, i) => [
        String(i + 1).padStart(2, '0'),
        item.description,
        String(item.quantity),
        `R$ ${item.unit_price.toFixed(2)}`,
        `R$ ${item.total.toFixed(2)}`
      ]),
      foot: [['', '', '', 'TOTAL:', `R$ ${order.total.toFixed(2)}`]],
      theme: 'grid',
      headStyles: {
        fillColor: [240, 244, 248],
        textColor: [40, 50, 60],
        fontStyle: 'bold',
        fontSize: 8,
        lineColor: [200, 210, 220],
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 50, 60],
        lineColor: [220, 225, 230],
        lineWidth: 0.2,
      },
      footStyles: {
        fillColor: [56, 189, 248],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
      },
    })

    // @ts-expect-error jspdf-autotable extends jsPDF
    y = doc.lastAutoTable.finalY + 5
  } else {
    doc.setFontSize(8)
    doc.setTextColor(150, 160, 170)
    doc.text('Nenhum item registrado.', margin + 4, y + 5)
    y += 12
  }

  // ============ SECTION 4: CONDIÇÕES DE ENTREGA ============
  y += 2
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 40, 50)
  doc.text('4. CONDIÇÕES DE ENTREGA', margin, y)
  y += 1
  doc.setDrawColor(74, 222, 128)
  doc.setLineWidth(1)
  doc.line(margin, y, margin + contentWidth * 0.3, y)
  doc.setDrawColor(56, 189, 248)
  doc.line(margin + contentWidth * 0.3, y, margin + contentWidth, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 70, 80)
  doc.text('Prazo de Execução:', margin + 2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(order.execution_deadline || 'A combinar', margin + 42, y)
  y += 5

  if (order.warranty) {
    doc.setFont('helvetica', 'bold')
    doc.text('Garantia:', margin + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.text(order.warranty, margin + 22, y)
    y += 5
  }

  if (order.delivery_conditions) {
    doc.setFont('helvetica', 'bold')
    doc.text('Observações:', margin + 2, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(order.delivery_conditions, contentWidth - 35)
    doc.text(lines, margin + 28, y)
    y += lines.length * 4 + 3
  }

  // ============ SIGNATURES ============
  y = Math.max(y + 15, 240)
  if (y > 260) {
    doc.addPage()
    y = 30
  }

  doc.setDrawColor(150, 160, 170)
  doc.setLineWidth(0.3)

  const sigWidth = (contentWidth - 20) / 2
  doc.line(margin, y, margin + sigWidth, y)
  doc.line(margin + sigWidth + 20, y, margin + contentWidth, y)

  doc.setFontSize(8)
  doc.setTextColor(100, 110, 120)
  doc.text('Técnico Responsável', margin + sigWidth / 2, y + 5, { align: 'center' })
  doc.text('Cliente', margin + sigWidth + 20 + sigWidth / 2, y + 5, { align: 'center' })

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(7)
  doc.setTextColor(150, 160, 170)
  doc.text('E-Tech Bike Elétrica — O Futuro Se Move Aqui.', pageWidth / 2, footerY, { align: 'center' })

  return doc
}

function drawSection(doc: jsPDF, title: string, content: string, margin: number, y: number, contentWidth: number): number {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 40, 50)
  doc.text(title, margin, y)
  y += 1

  // Green-blue gradient line
  doc.setDrawColor(74, 222, 128)
  doc.setLineWidth(1)
  doc.line(margin, y, margin + contentWidth * 0.3, y)
  doc.setDrawColor(56, 189, 248)
  doc.line(margin + contentWidth * 0.3, y, margin + contentWidth, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 70, 80)

  if (content) {
    const lines = doc.splitTextToSize(content, contentWidth - 4)
    doc.text(lines, margin + 2, y)
    y += lines.length * 4.5 + 6
  } else {
    y += 18
  }

  return y
}
