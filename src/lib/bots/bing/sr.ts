// @ts-ignore
const SpeechRecognitionPolyfill: typeof webkitSpeechRecognition = typeof window !== 'undefined' ? (
  // @ts-ignore
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  // @ts-ignore
  window.mozSpeechRecognition ||
  // @ts-ignore
  window.msSpeechRecognition ||
  // @ts-ignore
  window.oSpeechRecognition
) as typeof webkitSpeechRecognition : undefined

type subscriber = (msg: string, command?: string) => void

export class SR {
  recognition: SpeechRecognition
  onchange?: subscriber
  transcript: boolean = false
  listening: boolean = false
  private commandsRe?: RegExp
  constructor(commands: string[]) {
    this.recognition = new SpeechRecognitionPolyfill()
    this.configuration('zh-CN')
    if (commands.length) {
      this.commandsRe = new RegExp(`^(${commands.join('|')})。?$`)
    }
    this.recognition.onresult = this.speechRecognition
    this.recognition.onerror = (err) => {
      console.log('err', err.error)
      this.stop()
    }
    this.recognition.onend = () => {
      if (this.listening) {
        this.recognition.start()
      }
      console.log('end')
    }
  }

  speechRecognition = (event: SpeechRecognitionEvent) => {
    if (!this.listening) return
    for (var i = event.resultIndex; i < event.results.length; i++) {
      let result = event.results[i]
      if (result.isFinal) {
        var alt = result[0]
        const text = alt.transcript.trim()
        if (this.commandsRe && this.commandsRe.test(text)) {
          return this.onchange?.('', RegExp.$1)
        }
        if (!this.transcript) return
        this.onchange?.(text)
      }
    }
  }

  configuration = async (lang: string = 'zh-CN') => {
    return new Promise((resolve) => {
      this.recognition.continuous = true
      this.recognition.lang = lang
      this.recognition.onstart = resolve
    })
  }

  start = async () => {
    if (this.recognition && !this.listening) {
      await this.recognition.start()
      this.transcript = true
      this.listening = true
    }
  }

  stop = () => {
    if (this.recognition) {
      this.recognition.stop()
      this.transcript = false
      this.listening = false
    }
  }


  pause = () => {
    if (this.recognition) {
      this.transcript = false
    }
  }

  resume = () => {
    if (this.recognition) {
      this.transcript = true
    }
  }

  abort = () => {
    if (this.recognition && this.transcript) {
      this.recognition.abort()
      this.transcript = false
      this.listening = false
    }
  }
}
