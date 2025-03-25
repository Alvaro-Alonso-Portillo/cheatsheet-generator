// storage.js - Funcionalidad para guardar y cargar cheatsheets

// Clase para manejar el almacenamiento local
class CheatsheetStorage {
    constructor() {
        this.storageKey = 'devCheatsheets';
        this.init();
    }

    // Inicializar el almacenamiento
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Obtener todas las cheatsheets guardadas
    getAllCheatsheets() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Error al cargar cheatsheets:', error);
            return [];
        }
    }

    // Guardar una nueva cheatsheet
    saveCheatsheet(cheatsheet) {
        try {
            const cheatsheets = this.getAllCheatsheets();
            
            // Verificar si ya existe una cheatsheet con el mismo ID
            const existingIndex = cheatsheets.findIndex(item => item.id === cheatsheet.id);
            
            if (existingIndex >= 0) {
                // Actualizar cheatsheet existente
                cheatsheets[existingIndex] = cheatsheet;
            } else {
                // Asignar un nuevo ID si no tiene uno
                if (!cheatsheet.id) {
                    cheatsheet.id = this.generateId();
                }
                // Añadir fecha de creación
                if (!cheatsheet.createdAt) {
                    cheatsheet.createdAt = new Date().toISOString();
                }
                // Añadir nueva cheatsheet
                cheatsheet.updatedAt = new Date().toISOString();
                cheatsheets.push(cheatsheet);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(cheatsheets));
            return cheatsheet;
        } catch (error) {
            console.error('Error al guardar cheatsheet:', error);
            return null;
        }
    }
    // Eliminar una cheatsheet
    deleteCheatsheet(id) {
        try {
            let cheatsheets = this.getAllCheatsheets();
            cheatsheets = cheatsheets.filter(item => item.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(cheatsheets));
            return true;
        } catch (error) {
            console.error('Error al eliminar cheatsheet:', error);
            return false;
        }
    }

    // Obtener una cheatsheet por ID
    getCheatsheetById(id) {
        try {
            const cheatsheets = this.getAllCheatsheets();
            return cheatsheets.find(item => item.id === id) || null;
        } catch (error) {
            console.error('Error al obtener cheatsheet:', error);
            return null;
        }
    }

    // Generar un ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Exportar todas las cheatsheets (para backup)
    exportAllCheatsheets() {
        try {
            const cheatsheets = this.getAllCheatsheets();
            return JSON.stringify(cheatsheets);
        } catch (error) {
            console.error('Error al exportar cheatsheets:', error);
            return null;
        }
    }

    // Importar cheatsheets desde un backup
    importCheatsheets(jsonData) {
        try {
            const cheatsheets = JSON.parse(jsonData);
            if (Array.isArray(cheatsheets)) {
                localStorage.setItem(this.storageKey, JSON.stringify(cheatsheets));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al importar cheatsheets:', error);
            return false;
        }
    }
}

// Crear instancia global
const cheatsheetStorage = new CheatsheetStorage();
// Funciones para interactuar con la interfaz de usuario

// Guardar la cheatsheet actual
function saveCurrentCheatsheet() {
    // Obtener datos del formulario
    const title = document.getElementById('cheatsheetTitle').value || 'Sin título';
    const category = document.getElementById('cheatsheetCategory').value;
    const description = document.getElementById('cheatsheetDescription').value || '';
    
    // Recopilar snippets
    const snippets = [];
    document.querySelectorAll('.snippet-item').forEach(snippetEl => {
        const snippet = {
            title: snippetEl.querySelector('.snippet-title').value || 'Sin título',
            code: snippetEl.querySelector('.code-editor').value || '',
            language: snippetEl.querySelector('.language-selector select').value,
            explanation: snippetEl.querySelector('.snippet-explanation').value || ''
        };
        snippets.push(snippet);
    });
    
    // Crear objeto de cheatsheet
    const cheatsheet = {
        id: document.getElementById('cheatsheetId')?.value || null,
        title,
        category,
        description,
        snippets,
        updatedAt: new Date().toISOString()
    };
    
    // Guardar en almacenamiento local
    const savedCheatsheet = cheatsheetStorage.saveCheatsheet(cheatsheet);
    
    if (savedCheatsheet) {
        // Actualizar ID oculto si es nuevo
        if (!document.getElementById('cheatsheetId')?.value) {
            // Crear campo oculto para el ID si no existe
            if (!document.getElementById('cheatsheetId')) {
                const idField = document.createElement('input');
                idField.type = 'hidden';
                idField.id = 'cheatsheetId';
                document.querySelector('.editor-container').appendChild(idField);
            }
            document.getElementById('cheatsheetId').value = savedCheatsheet.id;
        }
        
        // Actualizar lista de cheatsheets guardadas
        updateSavedCheatsheetsList();
        
        // Mostrar mensaje de éxito
        alert(`Cheatsheet "${title}" guardada correctamente`);
        return true;
    } else {
        alert('Error al guardar la cheatsheet');
        return false;
    }
}
// Cargar una cheatsheet guardada
function loadCheatsheet(id) {
    const cheatsheet = cheatsheetStorage.getCheatsheetById(id);
    if (!cheatsheet) {
        alert('No se pudo encontrar la cheatsheet');
        return false;
    }
    
    // Limpiar formulario actual
    clearCheatsheetForm();
    
    // Cargar datos básicos
    document.getElementById('cheatsheetTitle').value = cheatsheet.title;
    document.getElementById('cheatsheetCategory').value = cheatsheet.category || 'javascript';
    document.getElementById('cheatsheetDescription').value = cheatsheet.description || '';
    
    // Crear campo oculto para el ID si no existe
    if (!document.getElementById('cheatsheetId')) {
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.id = 'cheatsheetId';
        document.querySelector('.editor-container').appendChild(idField);
    }
    document.getElementById('cheatsheetId').value = cheatsheet.id;
    
    // Eliminar snippets existentes
    const snippetsContainer = document.querySelector('.snippets-container');
    const snippetItems = snippetsContainer.querySelectorAll('.snippet-item');
    snippetItems.forEach((item, index) => {
        if (index > 0) { // Mantener al menos un snippet
            item.remove();
        }
    });
    
    // Cargar snippets
    if (cheatsheet.snippets && cheatsheet.snippets.length > 0) {
        // Actualizar el primer snippet
        const firstSnippet = snippetsContainer.querySelector('.snippet-item');
        if (firstSnippet) {
            firstSnippet.querySelector('.snippet-title').value = cheatsheet.snippets[0].title;
            firstSnippet.querySelector('.code-editor').value = cheatsheet.snippets[0].code;
            firstSnippet.querySelector('.language-selector select').value = cheatsheet.snippets[0].language;
            firstSnippet.querySelector('.snippet-explanation').value = cheatsheet.snippets[0].explanation;
        }
        
        // Añadir el resto de snippets
        for (let i = 1; i < cheatsheet.snippets.length; i++) {
            addNewSnippet();
            const snippetItems = snippetsContainer.querySelectorAll('.snippet-item');
            const currentSnippet = snippetItems[snippetItems.length - 1];
            
            currentSnippet.querySelector('.snippet-title').value = cheatsheet.snippets[i].title;
            currentSnippet.querySelector('.code-editor').value = cheatsheet.snippets[i].code;
            currentSnippet.querySelector('.language-selector select').value = cheatsheet.snippets[i].language;
            currentSnippet.querySelector('.snippet-explanation').value = cheatsheet.snippets[i].explanation;
        }
    }
    
    // Actualizar vista previa
    updatePreview();
    
    // Cambiar a la pestaña de editor
    document.getElementById('editor-tab').click();
    
    return true;
}
// Eliminar una cheatsheet
function deleteCheatsheet(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta cheatsheet? Esta acción no se puede deshacer.')) {
        const result = cheatsheetStorage.deleteCheatsheet(id);
        if (result) {
            // Actualizar lista de cheatsheets guardadas
            updateSavedCheatsheetsList();
            
            // Si la cheatsheet actual es la que se eliminó, limpiar el formulario
            if (document.getElementById('cheatsheetId')?.value === id) {
                clearCheatsheetForm();
            }
            
            alert('Cheatsheet eliminada correctamente');
            return true;
        } else {
            alert('Error al eliminar la cheatsheet');
            return false;
        }
    }
    return false;
}

// Limpiar el formulario de cheatsheet
function clearCheatsheetForm() {
    // Limpiar campos básicos
    document.getElementById('cheatsheetTitle').value = '';
    document.getElementById('cheatsheetCategory').value = 'javascript';
    document.getElementById('cheatsheetDescription').value = '';
    
    // Eliminar ID si existe
    if (document.getElementById('cheatsheetId')) {
        document.getElementById('cheatsheetId').value = '';
    }
    
    // Eliminar todos los snippets excepto el primero
    const snippetsContainer = document.querySelector('.snippets-container');
    const snippetItems = snippetsContainer.querySelectorAll('.snippet-item');
    snippetItems.forEach((item, index) => {
        if (index > 0) {
            item.remove();
        }
    });
    
    // Limpiar el primer snippet
    const firstSnippet = snippetsContainer.querySelector('.snippet-item');
    if (firstSnippet) {
        firstSnippet.querySelector('.snippet-title').value = '';
        firstSnippet.querySelector('.code-editor').value = '';
        firstSnippet.querySelector('.language-selector select').value = 'javascript';
        firstSnippet.querySelector('.snippet-explanation').value = '';
    }
}

// Actualizar la lista de cheatsheets guardadas
function updateSavedCheatsheetsList() {
    const cheatsheets = cheatsheetStorage.getAllCheatsheets();
    const listContainer = document.querySelector('.saved-cheatsheets-list .list-group');
    
    if (!listContainer) return;
    
    // Limpiar lista actual
    listContainer.innerHTML = '';
    
    if (cheatsheets.length === 0) {
        listContainer.innerHTML = '<div class="list-group-item">No hay cheatsheets guardadas</div>';
        return;
    }
    
    // Ordenar por fecha de actualización (más reciente primero)
    cheatsheets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Añadir cada cheatsheet a la lista
    cheatsheets.forEach(cheatsheet => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
            ${cheatsheet.title}
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${cheatsheet.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${cheatsheet.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        listContainer.appendChild(item);
        
        // Añadir event listeners
        item.querySelector('.edit-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            loadCheatsheet(this.getAttribute('data-id'));
        });
        
        item.querySelector('.delete-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deleteCheatsheet(this.getAttribute('data-id'));
        });
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            loadCheatsheet(item.querySelector('.edit-btn').getAttribute('data-id'));
        });
    });
}

// Inicializar funcionalidad de almacenamiento cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Añadir botón de guardar al editor
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        const saveButtonContainer = document.createElement('div');
        saveButtonContainer.className = 'text-end mt-3';
        saveButtonContainer.innerHTML = `
            <button class="btn btn-primary" id="saveCheatsheetBtn">
                <i class="fas fa-save"></i> Guardar Cheatsheet
            </button>
        `;
        editorContainer.appendChild(saveButtonContainer);
        
        // Añadir event listener al botón de guardar
        document.getElementById('saveCheatsheetBtn').addEventListener('click', function() {
            saveCurrentCheatsheet();
        });
    }
    
    // Inicializar lista de cheatsheets guardadas
    updateSavedCheatsheetsList();
    
    // Añadir botón para crear nueva cheatsheet
    const savedCheatsheetsList = document.querySelector('.saved-cheatsheets-list');
    if (savedCheatsheetsList) {
        const newButtonContainer = document.createElement('div');
        newButtonContainer.className = 'text-end mt-3';
        newButtonContainer.innerHTML = `
            <button class="btn btn-success" id="newCheatsheetBtn">
                <i class="fas fa-plus"></i> Nueva Cheatsheet
            </button>
        `;
        savedCheatsheetsList.appendChild(newButtonContainer);
        
        // Añadir event listener al botón de nueva cheatsheet
        document.getElementById('newCheatsheetBtn').addEventListener('click', function() {
            clearCheatsheetForm();
            document.getElementById('editor-tab').click();
        });
    }
});
