// export.js - Funcionalidad para exportar cheatsheets en diferentes formatos

// Clase para manejar la exportación de cheatsheets
class CheatsheetExporter {
    constructor() {
        // Configuración predeterminada
        this.config = {
            theme: 'light',
            paperSize: 'a4',
            includeLineNumbers: false,
            includeTableOfContents: true
        };
    }

    // Configurar opciones de exportación
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    // Exportar a PDF
    exportToPDF(cheatsheet) {
        try {
            // Obtener configuración
            const { paperSize } = this.config;
            
            // Crear objeto jsPDF con el tamaño de papel adecuado
            const orientation = 'portrait';
            let pdf;
            
            if (window.jspdf && window.jspdf.jsPDF) {
                // Usar jsPDF desde CDN
                pdf = new window.jspdf.jsPDF({
                    orientation,
                    unit: 'mm',
                    format: paperSize
                });
            } else {
                console.error('jsPDF no está disponible');
                return false;
            }
            
            // Preparar contenido para exportación
            const previewContainer = document.querySelector('.preview-container');
            
            // Usar html2canvas para convertir el contenido HTML a imagen
            if (window.html2canvas) {
                window.html2canvas(previewContainer).then(canvas => {
                    // Añadir imagen al PDF
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pdf.internal.pageSize.getWidth();
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    
                    // Guardar PDF
                    pdf.save(`${cheatsheet.title || 'cheatsheet'}.pdf`);
                });
                
                return true;
            } else {
                console.error('html2canvas no está disponible');
                return false;
            }
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            return false;
        }
    }
    // Exportar a HTML
    exportToHTML(cheatsheet) {
        try {
            // Obtener configuración
            const { theme, includeLineNumbers, includeTableOfContents } = this.config;
            
            // Crear documento HTML
            let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cheatsheet.title || 'Cheatsheet'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            ${theme === 'dark' ? 'background-color: #2c3e50; color: #ecf0f1;' : 
              theme === 'colorful' ? 'background-color: #f9f9f9; color: #333; border-left: 5px solid #4a6cf7;' :
              theme === 'minimal' ? 'background-color: white; color: #333; font-family: Courier New, Courier, monospace;' :
              'background-color: white; color: #333;'}
        }
        .cheatsheet-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .cheatsheet-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4a6cf7;
        }
        .snippet {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .snippet h3 {
            color: #4a6cf7;
            margin-bottom: 15px;
        }
        pre {
            background-color: ${theme === 'dark' ? '#1e2a38' : '#f8f9fa'};
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            ${theme === 'dark' ? 'color: #e6e6e6;' : 'color: #333;'}
        }
        .explanation {
            font-size: 0.95rem;
            ${theme === 'dark' ? 'color: #bdc3c7;' : 'color: #555;'}
        }
        .table-of-contents {
            background-color: ${theme === 'dark' ? '#1e2a38' : '#f8f9fa'};
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .table-of-contents h3 {
            margin-top: 0;
        }
        .table-of-contents ul {
            padding-left: 20px;
        }
        .table-of-contents a {
            text-decoration: none;
            color: #4a6cf7;
        }
        .line-numbers {
            counter-reset: line;
        }
        .line-numbers code {
            counter-increment: line;
        }
        .line-numbers code:before {
            content: counter(line);
            display: inline-block;
            width: 2em;
            padding-right: 0.5em;
            margin-right: 0.5em;
            text-align: right;
            color: #888;
            border-right: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="cheatsheet-container">
        <div class="cheatsheet-header">
            <h1>${cheatsheet.title || 'Cheatsheet'}</h1>
            <p>${cheatsheet.description || ''}</p>
        </div>`;
            
            // Añadir tabla de contenidos si está habilitada
            if (includeTableOfContents && cheatsheet.snippets && cheatsheet.snippets.length > 0) {
                html += `
        <div class="table-of-contents">
            <h3>Tabla de Contenidos</h3>
            <ul>`;
                
                cheatsheet.snippets.forEach((snippet, index) => {
                    const snippetId = `snippet-${index}`;
                    html += `
                <li><a href="#${snippetId}">${snippet.title || `Snippet ${index + 1}`}</a></li>`;
                });
                
                html += `
            </ul>
        </div>`;
            }
            // Añadir snippets
            if (cheatsheet.snippets && cheatsheet.snippets.length > 0) {
                cheatsheet.snippets.forEach((snippet, index) => {
                    const snippetId = `snippet-${index}`;
                    html += `
        <div class="snippet" id="${snippetId}">
            <h3>${snippet.title || `Snippet ${index + 1}`}</h3>
            <pre class="${includeLineNumbers ? 'line-numbers' : ''}"><code class="language-${snippet.language || 'javascript'}">${this.escapeHtml(snippet.code || '')}</code></pre>
            <div class="explanation">
                <p>${snippet.explanation || ''}</p>
            </div>
        </div>`;
                });
            }
            
            // Cerrar documento HTML
            html += `
    </div>
</body>
</html>`;
            
            // Crear blob y descargar
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cheatsheet.title || 'cheatsheet'}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar a HTML:', error);
            return false;
        }
    }

    // Exportar a Markdown
    exportToMarkdown(cheatsheet) {
        try {
            // Crear contenido Markdown
            let markdown = `# ${cheatsheet.title || 'Cheatsheet'}\n\n`;
            
            if (cheatsheet.description) {
                markdown += `${cheatsheet.description}\n\n`;
            }
            
            // Añadir tabla de contenidos si está habilitada
            if (this.config.includeTableOfContents && cheatsheet.snippets && cheatsheet.snippets.length > 0) {
                markdown += `## Tabla de Contenidos\n\n`;
                
                cheatsheet.snippets.forEach((snippet, index) => {
                    markdown += `- [${snippet.title || `Snippet ${index + 1}`}](#${this.slugify(snippet.title || `snippet-${index + 1}`)})\n`;
                });
                
                markdown += `\n`;
            }
            // Añadir snippets
            if (cheatsheet.snippets && cheatsheet.snippets.length > 0) {
                cheatsheet.snippets.forEach((snippet, index) => {
                    markdown += `## ${snippet.title || `Snippet ${index + 1}`}\n\n`;
                    markdown += `\`\`\`${snippet.language || 'javascript'}\n${snippet.code || ''}\n\`\`\`\n\n`;
                    
                    if (snippet.explanation) {
                        markdown += `${snippet.explanation}\n\n`;
                    }
                });
            }
            
            // Crear blob y descargar
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cheatsheet.title || 'cheatsheet'}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar a Markdown:', error);
            return false;
        }
    }
    
    // Convertir texto a slug para enlaces en Markdown
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
    
    // Escapar HTML para evitar problemas de seguridad
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Crear instancia global
const cheatsheetExporter = new CheatsheetExporter();

// Inicializar funcionalidad de exportación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Configurar opciones de exportación
    document.getElementById('exportBtn').addEventListener('click', function() {
        // Obtener opciones de exportación
        const theme = document.getElementById('exportTheme').value;
        const format = document.getElementById('exportFormat').value;
        const paperSize = document.getElementById('exportPaperSize').value;
        const includeLineNumbers = document.getElementById('includeLineNumbers').checked;
        const includeTableOfContents = document.getElementById('includeTableOfContents').checked;
        
        // Configurar exportador
        cheatsheetExporter.setConfig({
            theme,
            paperSize,
            includeLineNumbers,
            includeTableOfContents
        });
        
        // Obtener datos del cheatsheet actual
        const title = document.getElementById('previewTitle').textContent;
        const description = document.getElementById('previewDescription').textContent;
        
        // Recopilar snippets
        const snippets = [];
        document.querySelectorAll('.preview-snippet').forEach(snippetEl => {
            const snippet = {
                title: snippetEl.querySelector('h4').textContent,
                code: snippetEl.querySelector('pre code').textContent,
                language: snippetEl.querySelector('pre code').className.replace('language-', ''),
                explanation: snippetEl.querySelector('.explanation p').textContent
            };
            snippets.push(snippet);
        });
        
        // Crear objeto de cheatsheet
        const cheatsheet = {
            title,
            description,
            snippets
        };
        
        // Exportar según el formato seleccionado
        let success = false;
        switch (format) {
            case 'pdf':
                success = cheatsheetExporter.exportToPDF(cheatsheet);
                break;
            case 'html':
                success = cheatsheetExporter.exportToHTML(cheatsheet);
                break;
            case 'markdown':
                success = cheatsheetExporter.exportToMarkdown(cheatsheet);
                break;
        }
        
        if (success) {
            alert(`Cheatsheet exportada en formato ${format.toUpperCase()}`);
        } else {
            alert(`Error al exportar en formato ${format.toUpperCase()}`);
        }
    });
});
