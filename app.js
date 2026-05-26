'use strict'

// 🔗 Altere aqui para a URL da API que a sua turma está usando no OnRender!
const URL_API = "http://localhost:3000/contatos"

// Mapeamento dos IDs do HTML
const nomeInput = document.getElementById('app-input-nome')
const emailInput = document.getElementById('app-input-email')
const imagemInput = document.getElementById('app-input-imagem')
const estadoInput = document.getElementById('app-input-estado')
const btnSalvar = document.getElementById('btnSalvar')
const corpoTabela = document.getElementById('corpoTabela')

// ================= REQUISIÇÕES DIRETA PARA A API ================= //
async function getContatos() {
    const response = await fetch(URL_API)
    if (!response.ok) throw new Error('Não foi possível buscar os dados do servidor.')
    return await response.json()
}

async function postContato(contatoPayload) {
    const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contatoPayload)
    })
    if (!response.ok) throw new Error('Não foi possível salvar o contato no servidor.')
    return await response.json()
}

async function deleteContato(id) {
    const response = await fetch(`${URL_API}/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) throw new Error('Não foi possível deletar o contato do servidor.')
    return true
}

// ================= RENDERIZAR TABELA (GET) ================= //
async function carregarTabela() {
    try {
        console.log("Iniciando busca de contatos...");
        const dadosBrutos = await getContatos()
        
        corpoTabela.innerHTML = ''

        // Tratamento adaptativo caso o retorno seja um objeto contendo a array
        let contatos = []
        if (Array.isArray(dadosBrutos)) {
            contatos = dadosBrutos
        } else if (dadosBrutos && typeof dadosBrutos === 'object') {
            contatos = dadosBrutos.contatos || dadosBrutos.data || Object.values(dadosBrutos).find(Array.isArray) || []
        }

        if (contatos.length === 0) {
            corpoTabela.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">Nenhum contato encontrado no banco.</td></tr>'
            return
        }

        contatos.forEach(contato => {
            const tr = document.createElement('tr')

            const id = contato.id || 'N/A'
            const nome = contato.nome || 'Sem Nome'
            const urlFoto = contato.foto || contato.imagem || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'

            tr.innerHTML = `
                <td>${id}</td>
                <td>${nome}</td>
                <td>
                    <img src="${urlFoto}" class="avatar-img" alt="Foto" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'">
                </td>
                <td>
                    <button class="action-btn btn-edit" data-id="${id}">✏️</button>
                    <button class="action-btn btn-delete" data-id="${id}">🗑️</button>
                </td>
            `
            corpoTabela.appendChild(tr)
        })

        configurarEventosBotoes()

    } catch (error) {
        corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #d9534f; padding: 20px; font-weight: bold;">Erro na API: ${error.message}</td></tr>`
        console.error("Erro ao carregar tabela:", error)
    }
}

// ================= CADASTRAR CONTATO (POST) ================= //
async function salvarContato(evento) {
    if (evento) evento.preventDefault()

    const nome = nomeInput.value.trim()
    const email = emailInput.value.trim()
    const imagem = imagemInput.value.trim()
    const estado = estadoInput.value.trim()

    if (!nome || !email) {
        alert('Por favor, preencha obrigatoriamente Nome e E-mail.')
        return
    }

    const contatoPayload = {
        nome: nome,
        email: email,
        foto: imagem || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',             
        cidade: estado || 'Não informado',           
        celular: "11 99999-9999", 
        endereco: "Não informado" 
    }

    try {
        btnSalvar.textContent = "Salvando..."
        btnSalvar.disabled = true

        await postContato(contatoPayload)
        limparFormulario()
        
        // Pequena pausa para o banco do OnRender atualizar a tempo
        setTimeout(async () => {
            await carregarTabela()
            btnSalvar.textContent = "Salvar Contato"
            btnSalvar.disabled = false
        }, 500)

    } catch (error) {
        alert(`Erro ao salvar: ${error.message}`)
        btnSalvar.textContent = "Salvar Contato"
        btnSalvar.disabled = false
    }
}

// ================= COMPORTAMENTO DOS BOTÕES (DELETE / EDIT) ================= //
function configurarEventosBotoes() {
    
    document.querySelectorAll('.btn-delete').forEach(botao => {
        botao.onclick = async (e) => {
            const id = e.currentTarget.dataset.id
            if (id === 'N/A') return
            
            if (confirm(`Excluir o contato ID ${id}?`)) {
                try {
                    await deleteContato(id)
                    await carregarTabela()
                } catch (error) {
                    alert(`Não foi possível deletar: ${error.message}`)
                }
            }
        }
    })

    document.querySelectorAll('.btn-edit').forEach(botao => {
        botao.onclick = async (e) => {
            const id = e.currentTarget.dataset.id
            if (id === 'N/A') return
            
            try {
                const dadosBrutos = await getContatos()
                let contatos = Array.isArray(dadosBrutos) ? dadosBrutos : (dadosBrutos.contatos || [])
                const contatoAlvo = contatos.find(c => c.id == id)
                
                if (contatoAlvo) {
                    nomeInput.value = contatoAlvo.nome || ''
                    emailInput.value = contatoAlvo.email || ''
                    imagemInput.value = contatoAlvo.foto || contatoAlvo.imagem || ''
                    estadoInput.value = contatoAlvo.cidade || contatoAlvo.estado || ''
                    nomeInput.focus()
                }
            } catch (error) {
                console.error("Erro ao carregar dados para edição:", error)
            }
        }
    })
}

function limparFormulario() {
    nomeInput.value = ''
    emailInput.value = ''
    imagemInput.value = ''
    estadoInput.value = ''
}

// Configura o gatilho do botão
btnSalvar.onclick = salvarContato

// Executa a busca assim que abre a página
carregarTabela()