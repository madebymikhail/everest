const textarea = document.getElementById('prompt')
const sendBtn = document.getElementById('send')
const typeBtn = document.getElementById('type')
const modelSelect = document.getElementById('modelSelect')
const countdownOverlay = document.getElementById('countdown-overlay')
const countdownNumber = document.getElementById('countdown-number')

let loading = false
let typingActive = false

// --- Load models from backend on start ---
loadModels()

async function loadModels() {
  try {
    const res = await window.api.modelsList()
    const models = res.models || []
    modelSelect.innerHTML = ''

    if (models.length === 0) {
      const opt = document.createElement('option')
      opt.textContent = 'No models found'
      modelSelect.appendChild(opt)
      return
    }

    models.forEach((m) => {
      const opt = document.createElement('option')
      opt.value = m
      opt.textContent = m
      modelSelect.appendChild(opt)
    })

    if (res.current_model) {
      modelSelect.value = res.current_model
    }
  } catch (err) {
    console.error('Error loading models:', err)
    const opt = document.createElement('option')
    opt.textContent = 'Error loading models'
    modelSelect.appendChild(opt)
  }
}

// --- Send rewrite request ---
sendBtn.onclick = async () => {
  const text = textarea.value.trim()
  const model = modelSelect.value
  if (!text || !model || loading) return

  setLoading(true, 'send')

  const alpacaPrompt = {
    model,
    prompt: `### Instruction:\nRewrite the following text as Mikhail.\n\n### Input:\n${text}\n\n### Response:\n`,
    stream: false
  }

  try {
    const res = await window.api.prompt(alpacaPrompt)
    textarea.value = res.response || '(no response)'
  } catch (err) {
    console.error('Rewrite error:', err)
    textarea.value = '⚠️ Error: ' + err.message
  }

  setLoading(false)
}

// --- Type / Cancel Typing button ---
typeBtn.onclick = async () => {
  if (typingActive) {
    // Cancel typing
    setLoading(true, 'type')
    try {
      await window.api.cancelTyping()
      console.log('Typing canceled.')
    } catch (err) {
      console.error('Cancel typing error:', err)
    }
    typingActive = false
    setLoading(false)
    return
  }

  const text = textarea.value.trim()
  if (!text || loading) return

  typingActive = true
  setLoading(true, 'type')
  typeBtn.textContent = 'Cancel Typing'

  startCountdown(3, async () => {
    try {
      await window.api.typeText({ text })
      console.log('Typing started.')
    } catch (err) {
      console.error('Type error:', err)
      textarea.value = '⚠️ Error: ' + err.message
    } finally {
      setLoading(false)
      typingActive = false
      typeBtn.textContent = 'Type'
    }
  })
}

// --- Helper functions ---
function setLoading(state, mode = '') {
  loading = state
  sendBtn.disabled = state
  modelSelect.disabled = state
  textarea.disabled = state

  if (state) {
    if (mode === 'send') sendBtn.textContent = 'Sending...'
    if (mode === 'type' && !typingActive) typeBtn.textContent = 'Typing...'
  } else {
    sendBtn.textContent = 'Send'
    if (!typingActive) typeBtn.textContent = 'Type'
  }
}

function startCountdown(seconds, callback) {
  countdownOverlay.classList.remove('hidden')
  countdownOverlay.classList.add('active')

  let count = seconds
  countdownNumber.textContent = count

  const interval = setInterval(() => {
    count -= 1
    if (count > 0) {
      countdownNumber.textContent = count
    } else {
      clearInterval(interval)
      countdownOverlay.classList.remove('active')

      // ✅ fully hide and re-enable input
      setTimeout(() => {
        countdownOverlay.classList.add('hidden')
        callback()
      }, 400)
    }
  }, 1000)
}
