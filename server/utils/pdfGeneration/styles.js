/**
 * CSS styles for PDF generation
 * Optimized and aligned with HTML templates
 */

export const PDF_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body { 
    margin: 0; 
    padding: 0;
    font-family: 'Poppins', Arial, sans-serif;
    background: white;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Global SVG rendering optimization */
  svg {
    shape-rendering: geometricPrecision;
    text-rendering: geometricPrecision;
    image-rendering: -webkit-optimize-contrast;
  }
  
  svg path,
  svg circle,
  svg rect,
  svg line,
  svg polyline,
  svg polygon,
  svg ellipse {
    shape-rendering: geometricPrecision;
    vector-effect: non-scaling-stroke;
  }
  
  /* ============================================
     COVER PAGE STYLES
     ============================================ */
  .cover-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 40px 60px;
    page-break-after: always;
    background: white;
  }
  
  .cover-content {
    flex: 1;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 80px;
  }

  .cover-left {
    flex: 1;
    max-width: 45%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .cover-logo {
    display: flex;
    align-items: center;
    margin-bottom: 52px;
  }
  
  .cover-logo img {
    width: 140px;
    height: auto;
    display: block;
  }

  .cover-logo svg {
    width: 140px;
    height: auto;
    display: block;
  }

  .cover-main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .cover-title-wrapper {
    margin: 0;
  }
  
  .cover-main-title {
    font-family: 'Poppins', sans-serif;
    font-size: 44px;
    font-weight: 700;
    color: #1D1D1B;
    line-height: 1.25;
    margin: 0;
  }
  
  .cover-divider {
    width: 100%;
    height: 1px;
    background-color: #E9EAEC;
    margin: 10px 0;
  }
  
  .cover-info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cover-info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .cover-info-label {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #1D1D1B;
  }
  
  .cover-info-value {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #1D1D1B;
    line-height: 1.3;
  }
  
  .cover-illustration {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  
  .cover-illustration-img {
    width: auto;
    height: auto;
    max-width: 92%;
    max-height: 74%;
    object-fit: contain;
  }

  .cover-illustration-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background: #F4F4F4;
    color: #1D1D1B;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
  }
  
  /* ============================================
     PAGE HEADER STYLES (used on all pages)
     ============================================ */
  .page-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 20px;
    margin-top: 12px;
    margin-bottom: 20px;
  }
  
  .page-header-separator {
    flex: 1;
    height: 1px;
    margin: 0;
    border: none;
    background-color: #E0E0E0;
    align-self: flex-end;
  }
  
  .page-title {
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 14px;
    color: #1D1D1B;
    text-transform: uppercase;
  }
  
  .page-logo {
    height: 15px;
    display: flex;
    align-items: center;
  }
  
  .page-logo svg {
    height: 15px;
    width: 61px;
  }
  
  /* ============================================
     SCREENSHOT PAGES STYLES
     ============================================ */
  .screenshot-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    page-break-after: always;
    page-break-inside: avoid;
  }
  
  .screenshot-page:last-child {
    page-break-after: auto;
  }
  
  .screenshot-container {
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 20px 20px 20px;
  }
  
  .screenshot-image { 
    max-width: 100%;
    max-height: 80vh;
    height: auto;
    display: block;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  /* ============================================
     LOT SEPARATOR PAGE STYLES
     ============================================ */
  .lot-separator-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    page-break-after: always;
    page-break-inside: avoid;
    background: white;
  }
  
  .lot-sep-content {
    width: 100%;
    flex: 1;
    display: flex;
    gap: 80px;
    padding: 60px 179px 20px 179px;
    align-items: flex-start;
  }
  
  .lot-sep-left {
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 544px;
  }
  
  .lot-sep-title-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .lot-sep-label {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: normal;
    color: #787878;
    margin: 0;
  }
  
  .lot-sep-title {
    font-family: 'Poppins', sans-serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 36px;
    color: #1D1D1B;
    margin: 0;
    max-width: 544px;
  }
  
  .lot-sep-line-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .lot-sep-section-label {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: normal;
    color: #787878;
    margin: 0;
  }
  
  .lot-sep-items-list {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  
  .lot-sep-line-item {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: #1D1D1B;
    margin: 0;
    max-width: 342px;
  }
  
  .lot-sep-right {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex: 1;
    padding-top: 0;
  }
  
  .lot-sep-right svg {
    width: 308px;
    height: 332px;
    display: block;
    shape-rendering: geometricPrecision;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  /* ============================================
     PRINT MEDIA QUERIES
     ============================================ */
  @media print {
    .cover-page,
    .screenshot-page,
    .lot-separator-page {
      page-break-after: always;
    }
    
    .screenshot-image {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      page-break-inside: avoid;
    }
  }
`
