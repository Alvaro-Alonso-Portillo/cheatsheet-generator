// main.js - Funcionalidad principal del Generador de Cheatsheets

document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de componentes
    initializeApp();
    
    // Event listeners
    setupEventListeners();
    
    // Cargar datos de ejemplo
    loadSampleData();
});

// Inicialización de la aplicación
function initializeApp() {
    // Inicializar highlight.js para resaltado de código
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
    
    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}
// Configuración de event listeners
function setupEventListeners() {
    // Cambio de categoría en el sidebar
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Actualizar clase activa
            document.querySelectorAll('.category-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
            
            // Actualizar categoría seleccionada
            const category = this.getAttribute('data-category');
            document.getElementById('cheatsheetCategory').value = category;
            
            // Cargar plantillas de la categoría si es necesario
            loadCategoryTemplates(category);
        });
    });
    
    // Botón para añadir snippet
    document.getElementById('addSnippetBtn').addEventListener('click', function() {
        addNewSnippet();
    });
    
    // Cambio de pestaña a vista previa
    document.getElementById('preview-tab').addEventListener('click', function() {
        updatePreview();
    });
    
    // Botón de exportación
    document.getElementById('exportBtn').addEventListener('click', function() {
        exportCheatsheet();
    });
    
    // Eventos para los botones de los snippets existentes
    setupSnippetButtons();
}

// Configurar botones para los snippets
function setupSnippetButtons() {
    // Botones para eliminar snippets
    document.querySelectorAll('.remove-snippet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const snippetItem = this.closest('.snippet-item');
            snippetItem.remove();
        });
    });
    
    // Botones para mover snippets hacia arriba
    document.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const snippetItem = this.closest('.snippet-item');
            const prevSnippet = snippetItem.previousElementSibling;
            
            if (prevSnippet && prevSnippet.classList.contains('snippet-item')) {
                snippetItem.parentNode.insertBefore(snippetItem, prevSnippet);
            }
        });
    });
    
    // Botones para mover snippets hacia abajo
    document.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const snippetItem = this.closest('.snippet-item');
            const nextSnippet = snippetItem.nextElementSibling;
            
            if (nextSnippet && nextSnippet.classList.contains('snippet-item')) {
                snippetItem.parentNode.insertBefore(nextSnippet, snippetItem);
            }
        });
    });
    
    // Botones para generar explicaciones (deshabilitados por ahora)
    document.querySelectorAll('.generate-explanation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Esta funcionalidad se implementará cuando se integre con OpenAI
            alert('La integración con OpenAI para generar explicaciones automáticas estará disponible próximamente.');
        });
    });
}
// Añadir un nuevo snippet
function addNewSnippet() {
    const snippetsContainer = document.querySelector('.snippets-container');
    
    // Crear nuevo elemento de snippet
    const newSnippet = document.createElement('div');
    newSnippet.className = 'snippet-item card mb-3';
    newSnippet.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <input type="text" class="form-control form-control-sm snippet-title" placeholder="Título del snippet">
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary move-up-btn"><i class="fas fa-arrow-up"></i></button>
                <button class="btn btn-sm btn-outline-secondary move-down-btn"><i class="fas fa-arrow-down"></i></button>
                <button class="btn btn-sm btn-outline-danger remove-snippet-btn"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="card-body">
            <div class="mb-3">
                <label class="form-label">Código</label>
                <div class="code-editor-wrapper">
                    <textarea class="form-control code-editor" rows="5" placeholder="// Tu código aquí"></textarea>
                    <div class="language-selector">
                        <select class="form-select form-select-sm">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="jsx">JSX</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="bash">Bash</option>
                            <option value="sql">SQL</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Explicación</label>
                <textarea class="form-control snippet-explanation" rows="3" placeholder="Explica qué hace este código"></textarea>
                <button class="btn btn-sm btn-outline-secondary mt-2 generate-explanation-btn" disabled><i class="fas fa-magic"></i> Generar con IA</button>
            </div>
        </div>
    `;
    
    // Añadir después del último snippet o al final del contenedor
    const lastSnippet = snippetsContainer.querySelector('.snippet-item:last-child');
    if (lastSnippet) {
        lastSnippet.after(newSnippet);
    } else {
        snippetsContainer.appendChild(newSnippet);
    }
    
    // Configurar event listeners para los botones del nuevo snippet
    setupSnippetButtons();
}
// Actualizar la vista previa
function updatePreview() {
    // Obtener datos del formulario
    const title = document.getElementById('cheatsheetTitle').value || 'Mi Cheatsheet';
    const description = document.getElementById('cheatsheetDescription').value || 'Una guía de referencia rápida';
    
    // Actualizar encabezado de la vista previa
    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewDescription').textContent = description;
    
    // Limpiar contenido previo
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = '';
    
    // Generar contenido para cada snippet
    document.querySelectorAll('.snippet-item').forEach(snippet => {
        const snippetTitle = snippet.querySelector('.snippet-title').value || 'Sin título';
        const snippetCode = snippet.querySelector('.code-editor').value || '// No hay código';
        const snippetLanguage = snippet.querySelector('.language-selector select').value;
        const snippetExplanation = snippet.querySelector('.snippet-explanation').value || 'Sin explicación';
        
        // Crear elemento de vista previa para este snippet
        const previewSnippet = document.createElement('div');
        previewSnippet.className = 'preview-snippet';
        previewSnippet.innerHTML = `
            <h4>${snippetTitle}</h4>
            <pre><code class="language-${snippetLanguage}">${escapeHtml(snippetCode)}</code></pre>
            <div class="explanation">
                <p>${snippetExplanation}</p>
            </div>
        `;
        
        previewContent.appendChild(previewSnippet);
    });
    
    // Aplicar resaltado de sintaxis
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
}

// Exportar cheatsheet
function exportCheatsheet() {
    // Obtener opciones de exportación
    const format = document.getElementById('exportFormat').value;
    const theme = document.getElementById('exportTheme').value;
    
    // Actualizar vista previa antes de exportar
    updatePreview();
    
    // Aplicar tema a la vista previa
    const previewContainer = document.querySelector('.preview-container');
    previewContainer.className = 'preview-container mt-3';
    previewContainer.classList.add(`theme-${theme}`);
    
    // Exportar según el formato seleccionado
    switch (format) {
        case 'pdf':
            exportToPdf();
            break;
        case 'html':
            exportToHtml();
            break;
        case 'markdown':
            exportToMarkdown();
            break;
    }
    
    // Mostrar mensaje de éxito
    alert(`Cheatsheet exportada en formato ${format.toUpperCase()}`);
}
// Exportar a PDF (simulado)
function exportToPdf() {
    // En una implementación real, usaríamos html2canvas y jsPDF
    console.log('Exportando a PDF...');
    // La implementación completa requeriría más código para convertir HTML a PDF
}

// Exportar a HTML (simulado)
function exportToHtml() {
    // En una implementación real, generaríamos un archivo HTML para descargar
    console.log('Exportando a HTML...');
    // La implementación completa requeriría generar un archivo HTML y descargarlo
}

// Exportar a Markdown (simulado)
function exportToMarkdown() {
    // En una implementación real, convertiríamos el contenido a formato Markdown
    console.log('Exportando a Markdown...');
    // La implementación completa requeriría convertir HTML a Markdown y descargarlo
}

// Cargar datos de ejemplo
function loadSampleData() {
    // Cargar título y descripción de ejemplo
    document.getElementById('cheatsheetTitle').value = 'JavaScript ES6 Cheatsheet';
    document.getElementById('cheatsheetDescription').value = 'Una guía rápida de referencia para las características de ES6';
    
    // El primer snippet ya está en el HTML por defecto, configuramos sus valores
    const firstSnippet = document.querySelector('.snippet-item');
    if (firstSnippet) {
        firstSnippet.querySelector('.snippet-title').value = 'Arrow Functions';
        firstSnippet.querySelector('.code-editor').value = `// Función tradicional
function sum(a, b) {
  return a + b;
}

// Arrow function equivalente
const sum = (a, b) => a + b;

// Con un solo parámetro, los paréntesis son opcionales
const double = n => n * 2;

// Con cuerpo de función, se requieren llaves y return
const multiply = (a, b) => {
  const result = a * b;
  return result;
};`;
        firstSnippet.querySelector('.snippet-explanation').value = 'Las arrow functions proporcionan una sintaxis más concisa para escribir funciones en JavaScript. No tienen su propio this, arguments, super o new.target, lo que las hace ideales para funciones no-método.';
    }
    
    // Añadir un segundo snippet de ejemplo
    addNewSnippet();
    const secondSnippet = document.querySelectorAll('.snippet-item')[1];
    if (secondSnippet) {
        secondSnippet.querySelector('.snippet-title').value = 'Destructuring';
        secondSnippet.querySelector('.code-editor').value = `// Destructuring de arrays
const [first, second, ...rest] = [1, 2, 3, 4, 5];
console.log(first);  // 1
console.log(second); // 2
console.log(rest);   // [3, 4, 5]

// Destructuring de objetos
const person = {
  name: 'John',
  age: 30,
  city: 'New York'
};

const { name, age, city: location } = person;
console.log(name);     // 'John'
console.log(age);      // 30
console.log(location); // 'New York'`;
        secondSnippet.querySelector('.snippet-explanation').value = 'La sintaxis de destructuring permite desempaquetar valores de arrays o propiedades de objetos en variables distintas. Es una forma concisa de extraer múltiples valores de datos almacenados en objetos y arrays.';
        secondSnippet.querySelector('.language-selector select').value = 'javascript';
    }
}

// Cargar plantillas según la categoría (simulado)
function loadCategoryTemplates(category) {
    console.log(`Cargando plantillas para la categoría: ${category}`);
    // En una implementación real, cargaríamos plantillas predefinidas según la categoría
}

// Función auxiliar para escapar HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
