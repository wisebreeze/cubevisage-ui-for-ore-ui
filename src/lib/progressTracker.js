// @ts-check
import readline from 'readline'

export class ProgressTracker {
  constructor(total, message) {
    this.total = total
    this.current = 0
    this.message = message
    this.startTime = Date.now()
    this.lastUpdate = 0
    this.isComplete = false
    this.lastProgress = ''
  }
  
  update(count = 1) {
    this.current += count
    const now = Date.now()
    
    if (now - this.lastUpdate < 100 && this.current < this.total) {
      return
    }
    
    this.lastUpdate = now
    this._renderProgress()
  }
  
  _renderProgress() {
    const percent = Math.floor((this.current / this.total) * 100)
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)
    
    this.lastProgress = `${this.message} ${percent}% (${this.current}/${this.total}) | ${elapsed}s`
    
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(this.lastProgress)
  }
  
  log(message) {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    
    console.log(message)
    
    if (!this.isComplete && this.current < this.total) {
      process.stdout.write(this.lastProgress)
    }
  }
  
  complete() {
    if (this.isComplete) return
    
    this.isComplete = true
    this.update(this.total - this.current)
    
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    console.log(`${this.message} 100% (${this.total}/${this.total}) | ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`)
  }
}