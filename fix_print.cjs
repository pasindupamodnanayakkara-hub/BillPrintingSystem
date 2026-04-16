const fs = require('fs');

const file = 'src/components/InvoiceGenerator.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldCss = `      <style>{\`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print-transform { transform: none !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area { 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 210mm !important; 
            height: 297mm !important; 
            margin: 0 !important; 
            padding: 8mm !important;
            z-index: 9999 !important; 
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          #invoice-print-area > div { height: 100% !important; display: flex !important; flex-direction: column !important; }
          .no-print { display: none !important; }
        }
      \`}</style>`;

const newCss = `      <style>{\`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; margin: 0; padding: 0; }
          body * { visibility: hidden !important; display: none !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; display: flex !important; }
          #invoice-print-area { 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 210mm !important; 
            margin: 0 !important; 
            padding: 12mm !important;
            z-index: 9999 !important; 
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            transform: none !important;
            zoom: 1 !important;
          }
          #invoice-print-area > div { height: 100% !important; display: flex !important; flex-direction: column !important; }
        }
      \`}</style>`;

content = content.replace(oldCss, newCss);

// Find <div id="invoice-print-area" ...> ... </div>
const startMarker = '<div id="invoice-print-area"';
let i = content.indexOf(startMarker);
if (i === -1) { console.error("Start marker not found"); process.exit(1); }

let nestCount = 0;
let endIndex = -1;
let openDivsRegex = /<div/g;
let closeDivsRegex = /<\/div/g;
let currentIndex = i;

while (currentIndex < content.length) {
    if (content.substr(currentIndex, 4) === '<div') {
        nestCount++;
        currentIndex += 4;
    } else if (content.substr(currentIndex, 5) === '</div') {
        nestCount--;
        if (nestCount === 0) {
            endIndex = currentIndex + 6;
            break;
        }
        currentIndex += 5;
    } else {
        currentIndex++;
    }
}

if (endIndex === -1) { console.error("End marker not found"); process.exit(1); }

// we copy the entire div block except we rename its ID so it becomes the PREVIEW area
let originalBlock = content.substring(i, endIndex);
let previewBlock = originalBlock.replace('id="invoice-print-area"', 'id="invoice-preview-area"').replace('ref={printRef}', '');

// replace the original block with the preview block
content = content.replace(originalBlock, previewBlock);

// Now change the MAIN wrapper from 
// <div className="flex h-full bg-transparent p-5 gap-5">
// to include print:hidden
content = content.replace('<div className="flex h-full bg-transparent p-5 gap-5">', '<div className="flex h-full bg-transparent p-5 gap-5 print:hidden">');

// Now grab the inner DOM inside the preview block (which is the actual invoice)
// the inner DOM starts after the first > of the preview block and ends before the last </div>
let firstCloseBracket = previewBlock.indexOf('>');
let invoiceInnerDOM = previewBlock.substring(firstCloseBracket + 1, previewBlock.length - 6);

// We append the dedicated print section at the very end before </>
const dedicatedPrintSection = `
      {/* Hidden Dedicated Print Container */}
      <div id="invoice-print-area" className="hidden print:flex fixed inset-0 w-[210mm] min-h-[297mm] bg-white z-[9999] flex-col" ref={printRef}>
        ${invoiceInnerDOM}
      </div>
    </>
`;

content = content.replace('      </div>\n    </>', '      </div>\n' + dedicatedPrintSection);

fs.writeFileSync(file, content);
console.log("Success");
