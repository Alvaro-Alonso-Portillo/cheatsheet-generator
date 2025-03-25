// openai.js - Integración con OpenAI para generar explicaciones automáticas

// Clase para manejar la integración con OpenAI
class OpenAIIntegration {
    constructor() {
        this.apiKey = ''; // La clave API se debe proporcionar por el usuario
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-3.5-turbo'; // Modelo predeterminado
        this.cacheKey = 'openaiExplanationCache';
        this.initCache() ;
    }

    // Inicializar caché para explicaciones
    initCache() {
        if (!localStorage.getItem(this.cacheKey)) {
            localStorage.setItem(this.cacheKey, JSON.stringify({}));
        }
    }

    // Configurar la clave API
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        return this.apiKey !== '';
    }

    // Verificar si la clave API está configurada
    hasApiKey() {
        return this.apiKey !== '';
    }

    // Generar explicación para un snippet de código
    async generateExplanation(code, language) {
        if (!this.hasApiKey()) {
            throw new Error('API key not configured');
        }

        // Verificar si ya existe en caché
        const cacheKey = this.generateCacheKey(code, language);
        const cachedExplanation = this.getFromCache(cacheKey);
        if (cachedExplanation) {
            return cachedExplanation;
        }

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Eres un experto en programación que explica código de manera clara y concisa. Explica el siguiente código ${language} en español, destacando su propósito, funcionamiento y posibles casos de uso. Sé breve pero completo.`
                        },
                        {
                            role: 'user',
                            content: code
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const explanation = data.choices[0].message.content.trim();
            
            // Guardar en caché
            this.saveToCache(cacheKey, explanation);
            
            return explanation;
        } catch (error) {
            console.error('Error generating explanation:', error);
            throw error;
        }
    }
    // Generar clave para caché
    generateCacheKey(code, language) {
        // Crear un hash simple del código para usar como clave
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            const char = code.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a entero de 32 bits
        }
        return `${language}_${hash}`;
    }

    // Guardar explicación en caché
    saveToCache(key, explanation) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey)) || {};
            cache[key] = {
                explanation,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    // Obtener explicación de caché
    getFromCache(key) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey)) || {};
            const cachedItem = cache[key];
            
            if (cachedItem) {
                // Verificar si la caché es reciente (menos de 7 días)
                const now = Date.now();
                const cacheAge = now - cachedItem.timestamp;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
                
                if (cacheAge < maxAge) {
                    return cachedItem.explanation;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting from cache:', error);
            return null;
        }
    }

    // Limpiar caché
    clearCache() {
        localStorage.setItem(this.cacheKey, JSON.stringify({}));
    }
}

// Crear instancia global
const openaiIntegration = new OpenAIIntegration();
// Funciones para interactuar con la interfaz de usuario

// Configurar la integración con OpenAI
function setupOpenAIIntegration() {
    // Crear modal de configuración si no existe
    if (!document.getElementById('openaiConfigModal')) {
        const modalHTML = `
            <div class="modal fade" id="openaiConfigModal" tabindex="-1" aria-labelledby="openaiConfigModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="openaiConfigModalLabel">Configuración de OpenAI</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="openaiApiKey" class="form-label">API Key de OpenAI</label>
                                <input type="password" class="form-control" id="openaiApiKey" placeholder="sk-...">
                                <div class="form-text">Tu API key se guardará localmente en tu navegador.</div>
                            </div>
                            <div class="mb-3">
                                <label for="openaiModel" class="form-label">Modelo</label>
                                <select class="form-select" id="openaiModel">
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="gpt-4">GPT-4</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveOpenaiConfigBtn">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Añadir event listener al botón de guardar
        document.getElementById('saveOpenaiConfigBtn').addEventListener('click', function() {
            const apiKey = document.getElementById('openaiApiKey').value;
            const model = document.getElementById('openaiModel').value;
            
            if (apiKey) {
                openaiIntegration.setApiKey(apiKey);
                openaiIntegration.model = model;
                
                // Guardar en localStorage para futuras sesiones
                localStorage.setItem('openaiApiKey', apiKey);
                localStorage.setItem('openaiModel', model);
                
                // Habilitar botones de generación
                enableGenerateButtons();
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('openaiConfigModal'));
                modal.hide();
                
                alert('Configuración de OpenAI guardada correctamente');
            } else {
                alert('Por favor, introduce una API key válida');
            }
        });
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('openaiConfigModal'));
    modal.show();
    
    // Cargar configuración guardada si existe
    const savedApiKey = localStorage.getItem('openaiApiKey');
    const savedModel = localStorage.getItem('openaiModel');
    
    if (savedApiKey) {
        document.getElementById('openaiApiKey').value = savedApiKey;
        openaiIntegration.setApiKey(savedApiKey);
    }
    
    if (savedModel) {
        document.getElementById('openaiModel').value = savedModel;
        openaiIntegration.model = savedModel;
    }
}

// Habilitar botones de generación de explicaciones
function enableGenerateButtons() {
    document.querySelectorAll('.generate-explanation-btn').forEach(btn => {
        btn.disabled = false;
        
        // Añadir event listener si no lo tiene
        if (!btn.hasAttribute('data-has-listener')) {
            btn.addEventListener('click', async function() {
                const snippetItem = this.closest('.snippet-item');
                const codeEditor = snippetItem.querySelector('.code-editor');
                const explanationField = snippetItem.querySelector('.snippet-explanation');
                const languageSelect = snippetItem.querySelector('.language-selector select');
                
                const code = codeEditor.value;
                const language = languageSelect.value;
                
                if (!code) {
                    alert('Por favor, introduce código para generar una explicación');
                    return;
                }
                
                try {
                    // Mostrar indicador de carga
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
                    this.disabled = true;
                    
                    // Generar explicación
                    const explanation = await openaiIntegration.generateExplanation(code, language);
                    
                    // Actualizar campo de explicación
                    explanationField.value = explanation;
                    
                    // Restaurar botón
                    this.innerHTML = '<i class="fas fa-magic"></i> Generar con IA';
                    this.disabled = false;
                } catch (error) {
                    console.error('Error generating explanation:', error);
                    alert(`Error al generar explicación: ${error.message}`);
                    
                    // Restaurar botón
                    this.innerHTML = '<i class="fas fa-magic"></i> Generar con IA';
                    this.disabled = false;
                }
            });
            
            btn.setAttribute('data-has-listener', 'true');
        }
    });
}

// Inicializar funcionalidad de OpenAI cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Añadir botón de configuración de OpenAI
    const headerElement = document.querySelector('.header');
    if (headerElement) {
        const configButtonContainer = document.createElement('div');
        configButtonContainer.className = 'text-end mb-3';
        configButtonContainer.innerHTML = `
            <button class="btn btn-outline-primary" id="openaiConfigBtn">
                <i class="fas fa-cog"></i> Configurar OpenAI
            </button>
        `;
        headerElement.appendChild(configButtonContainer);
        
        // Añadir event listener al botón de configuración
        document.getElementById('openaiConfigBtn').addEventListener('click', function() {
            setupOpenAIIntegration();
        });
    }
    
    // Cargar configuración guardada si existe
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedApiKey) {
        openaiIntegration.setApiKey(savedApiKey);
        
        const savedModel = localStorage.getItem('openaiModel');
        if (savedModel) {
            openaiIntegration.model = savedModel;
        }
        
        // Habilitar botones de generación
        enableGenerateButtons();
    }
});
