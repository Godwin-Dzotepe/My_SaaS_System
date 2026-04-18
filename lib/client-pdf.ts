'use client';

function normalizePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function wrapPdfLine(line: string, maxChars = 92) {
  const words = normalizePdfText(line).split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!word) continue;
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function buildPdfFromLines(lines: string[]) {
  const linesPerPage = 48;
  const pageChunks: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pageChunks.push(lines.slice(i, i + linesPerPage));
  }
  if (pageChunks.length === 0) pageChunks.push(['No content available.']);

  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

  const pageEntries: string[] = [];
  let nextObjectNumber = 4;

  for (const chunk of pageChunks) {
    const pageObjectNumber = nextObjectNumber++;
    const contentObjectNumber = nextObjectNumber++;

    const contentLines = chunk
      .map((line) => `(${escapePdfText(line)}) Tj\nT*`)
      .join('\n');
    const contentStream = `BT\n/F1 10 Tf\n14 TL\n40 800 Td\n${contentLines}\nET`;

    objects[contentObjectNumber] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
    pageEntries.push(`${pageObjectNumber} 0 R`);
    objects[pageObjectNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
  }

  objects[2] = `<< /Type /Pages /Kids [${pageEntries.join(' ')}] /Count ${pageEntries.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function getPdfFilename(filenameBase: string) {
  const normalized = filenameBase.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replaceAll(' ', '-').toLowerCase();
  return `${normalized || 'report'}.pdf`;
}

type PdfImageType = 'jpeg' | 'png' | 'webp' | 'JPEG' | 'PNG' | 'WEBP';

interface ElementPdfOptions {
  ignoreSelectors?: string[];
  backgroundColor?: string;
  imageType?: PdfImageType;
  imageQuality?: number;
  scale?: number;
  reportTitle?: string;
  preferLandscape?: boolean;
  deliveryMode?: 'auto' | 'download';
  showHeaderFooter?: boolean;
}

const UNSUPPORTED_COLOR_FUNCTION_RE = /\b(?:lab|lch|oklab|oklch)\(/i;
const UNSUPPORTED_COLOR_TOKEN_RE = /\b(?:lab|lch|oklab|oklch)\([^)]*\)/gi;

let colorNormalizationContext: CanvasRenderingContext2D | null | undefined;
const normalizedColorTokenCache = new Map<string, string | null>();

function getColorNormalizationContext() {
  if (colorNormalizationContext !== undefined) {
    return colorNormalizationContext;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    colorNormalizationContext = context;
    return context;
  } catch {
    colorNormalizationContext = null;
    return null;
  }
}

function normalizeSingleColorToken(colorToken: string) {
  if (normalizedColorTokenCache.has(colorToken)) {
    return normalizedColorTokenCache.get(colorToken) || null;
  }

  let normalizedColor: string | null = null;

  try {
    const sample = document.createElement('span');
    sample.style.color = colorToken;
    sample.style.position = 'fixed';
    sample.style.left = '-9999px';
    sample.style.top = '0';
    document.body.appendChild(sample);
    const computedColor = window.getComputedStyle(sample).color;
    document.body.removeChild(sample);

    if (computedColor && !UNSUPPORTED_COLOR_FUNCTION_RE.test(computedColor)) {
      normalizedColor = computedColor;
    }
  } catch {
    normalizedColor = null;
  }

  if (normalizedColor) {
    normalizedColorTokenCache.set(colorToken, normalizedColor);
    return normalizedColor;
  }

  const context = getColorNormalizationContext();
  if (!context) {
    normalizedColorTokenCache.set(colorToken, null);
    return null;
  }

  const sentinel = 'rgb(1, 2, 3)';

  try {
    context.fillStyle = sentinel;
    context.fillStyle = colorToken;
    const normalized = context.fillStyle;

    if (!normalized || normalized === sentinel || UNSUPPORTED_COLOR_FUNCTION_RE.test(normalized)) {
      normalizedColorTokenCache.set(colorToken, null);
      return null;
    }

    normalizedColorTokenCache.set(colorToken, normalized);
    return normalized;
  } catch {
    normalizedColorTokenCache.set(colorToken, null);
    return null;
  }
}

function normalizeUnsupportedColorFunctions(value: string) {
  if (!UNSUPPORTED_COLOR_FUNCTION_RE.test(value)) {
    return value;
  }

  return value.replace(UNSUPPORTED_COLOR_TOKEN_RE, (token) => normalizeSingleColorToken(token) || 'rgb(0, 0, 0)');
}

function sanitizeComputedStylesUnsupportedColors(clonedDocument: Document, clonedRoot: HTMLElement) {
  const computedStyleWindow = clonedDocument.defaultView;
  if (!computedStyleWindow) {
    return;
  }

  const cloneNodes: Element[] = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];

  for (const cloneNode of cloneNodes) {

    if (!(cloneNode instanceof HTMLElement) && !(cloneNode instanceof SVGElement)) {
      continue;
    }

    const computed = computedStyleWindow.getComputedStyle(cloneNode);

    for (let propertyIndex = 0; propertyIndex < computed.length; propertyIndex++) {
      const propertyName = computed.item(propertyIndex);
      const rawValue = computed.getPropertyValue(propertyName);

      if (!rawValue || !UNSUPPORTED_COLOR_FUNCTION_RE.test(rawValue)) {
        continue;
      }

      const normalizedValue = normalizeUnsupportedColorFunctions(rawValue);

      if (normalizedValue !== rawValue && !UNSUPPORTED_COLOR_FUNCTION_RE.test(normalizedValue)) {
        cloneNode.style.setProperty(propertyName, normalizedValue, 'important');
      }
    }
  }
}

function sanitizeStyleTagsUnsupportedColors(clonedDocument: Document) {
  const styleTags = clonedDocument.querySelectorAll('style');

  for (const styleTag of styleTags) {
    const cssText = styleTag.textContent;

    if (!cssText || !UNSUPPORTED_COLOR_FUNCTION_RE.test(cssText)) {
      continue;
    }

    styleTag.textContent = normalizeUnsupportedColorFunctions(cssText);
  }
}

function isMobileUserAgent() {
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  return isIos || isAndroid;
}

async function tryNativeShare(blob: Blob, filename: string) {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (typeof nav.share !== 'function' || typeof File === 'undefined') {
    return false;
  }

  const file = new File([blob], filename, { type: 'application/pdf' });
  const sharePayload: ShareData = {
    title: filename,
    files: [file],
  };

  if (typeof nav.canShare === 'function' && !nav.canShare(sharePayload)) {
    return false;
  }

  try {
    await nav.share(sharePayload);
    return true;
  } catch {
    return false;
  }
}

async function deliverPdfBlob(blob: Blob, filename: string, deliveryMode: 'auto' | 'download' = 'auto') {
  if (deliveryMode === 'auto' && (await tryNativeShare(blob, filename))) {
    return;
  }

  const url = URL.createObjectURL(blob);

  try {
    if (deliveryMode === 'download') {
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      downloadAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      return;
    }

    if (isMobileUserAgent()) {
      const popup = window.open(url, '_blank', 'noopener,noreferrer');

      if (!popup) {
        const mobileAnchor = document.createElement('a');
        mobileAnchor.href = url;
        mobileAnchor.target = '_blank';
        mobileAnchor.rel = 'noopener noreferrer';
        document.body.appendChild(mobileAnchor);
        mobileAnchor.click();
        document.body.removeChild(mobileAnchor);
      }

      return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 45000);
  }
}

async function renderElementToPdfBlob(element: HTMLElement, options: ElementPdfOptions) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

  const ignoredSelectors = options.ignoreSelectors || ['[data-pdf-ignore="true"]'];
  const imageType = options.imageType || 'PNG';
  const imageMime = imageType === 'JPEG' ? 'image/jpeg' : 'image/png';
  const scale = options.scale || Math.min(2, window.devicePixelRatio || 1.5);

  const captureRootMarker = `pdf-capture-${Math.random().toString(36).slice(2, 10)}`;
  element.setAttribute('data-pdf-capture-root', captureRootMarker);

  const baseCaptureOptions = {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: options.backgroundColor || '#ffffff',
    logging: false,
    windowWidth: Math.max(document.documentElement.clientWidth, element.scrollWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, element.scrollHeight),
    scrollX: 0,
    scrollY: -window.scrollY,
    onclone: (clonedDocument: Document) => {
      sanitizeStyleTagsUnsupportedColors(clonedDocument);

      const clonedRoot = clonedDocument.querySelector(`[data-pdf-capture-root="${captureRootMarker}"]`);
      if (clonedRoot instanceof HTMLElement) {
        sanitizeComputedStylesUnsupportedColors(clonedDocument, clonedRoot);
      }
    },
    ignoreElements: (candidate: Element) => {
      if (!(candidate instanceof Element)) {
        return false;
      }

      return ignoredSelectors.some((selector) => candidate.matches(selector) || Boolean(candidate.closest(selector)));
    },
  };

  let canvas: HTMLCanvasElement;

  try {
    canvas = await html2canvas(element, {
      ...baseCaptureOptions,
      foreignObjectRendering: true,
    });
  } catch {
    canvas = await html2canvas(element, {
      ...baseCaptureOptions,
      foreignObjectRendering: false,
    });
  } finally {
    element.removeAttribute('data-pdf-capture-root');
  }

  const orientation = options.preferLandscape ? 'landscape' : canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageMargin = orientation === 'landscape' ? 18 : 24;
  const showHeaderFooter = options.showHeaderFooter !== false;
  const headerBlockHeight = showHeaderFooter ? 20 : 0;
  const footerBlockHeight = showHeaderFooter ? 16 : 0;
  const contentTop = pageMargin + headerBlockHeight;
  const contentBottom = pageMargin + footerBlockHeight;
  const contentWidth = pageWidth - pageMargin * 2;
  const contentHeight = pageHeight - contentTop - contentBottom;

  const pxPerPt = canvas.width / contentWidth;
  const sliceHeightPx = Math.max(1, Math.floor(contentHeight * pxPerPt));

  const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));
  const generatedAtLabel = `Generated ${new Date().toLocaleString('en-US')}`;

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const remainingPx = canvas.height - sourceY;
    const currentSliceHeightPx = Math.min(sliceHeightPx, remainingPx);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = currentSliceHeightPx;

    const sliceContext = sliceCanvas.getContext('2d');
    if (!sliceContext) {
      throw new Error('Failed to prepare PDF page rendering context.');
    }

    sliceContext.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      currentSliceHeightPx,
      0,
      0,
      canvas.width,
      currentSliceHeightPx
    );

    const pageImageData = sliceCanvas.toDataURL(imageMime, options.imageQuality || 0.95);
    const renderedHeightPt = currentSliceHeightPx / pxPerPt;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const currentPage = pageIndex + 1;
    if (showHeaderFooter) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(41, 55, 82);
      pdf.text(options.reportTitle || 'School Report', pageMargin, pageMargin + 10);

      pdf.setDrawColor(220, 225, 234);
      pdf.line(pageMargin, pageMargin + 14, pageWidth - pageMargin, pageMargin + 14);
    }

    pdf.addImage(pageImageData, imageType, pageMargin, contentTop, contentWidth, renderedHeightPt);

    if (showHeaderFooter) {
      const footerY = pageHeight - pageMargin;
      pdf.setDrawColor(220, 225, 234);
      pdf.line(pageMargin, footerY - 9, pageWidth - pageMargin, footerY - 9);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(86, 101, 127);
      pdf.text(generatedAtLabel, pageMargin, footerY);
      pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - pageMargin, footerY, { align: 'right' });
    }

    sourceY += currentSliceHeightPx;
    pageIndex += 1;
  }

  return pdf.output('blob');
}

export async function downloadPdfFromElement(
  filenameBase: string,
  element: HTMLElement | null,
  options: ElementPdfOptions = {}
) {
  if (!element) {
    throw new Error('No visible content is available for PDF export.');
  }

  const filename = getPdfFilename(filenameBase);
  const blob = await renderElementToPdfBlob(element, options);
  await deliverPdfBlob(blob, filename, options.deliveryMode || 'auto');
}

export async function downloadPdfFromLines(filenameBase: string, rawLines: string[]) {
  const lines = rawLines.flatMap((line) => wrapPdfLine(line));
  const pdfBytes = buildPdfFromLines(lines);
  const filename = getPdfFilename(filenameBase);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  await deliverPdfBlob(blob, filename);
}
