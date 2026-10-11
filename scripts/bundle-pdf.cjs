const fs=require('fs');
fs.mkdirSync('src/generated',{recursive:true});
fs.writeFileSync('src/generated/pdf-runtime.json',JSON.stringify({main:fs.readFileSync('node_modules/pdfjs-dist/legacy/build/pdf.min.mjs','utf8'),worker:fs.readFileSync('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs','utf8')}));
