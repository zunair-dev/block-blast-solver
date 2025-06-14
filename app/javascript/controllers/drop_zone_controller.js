import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "zone", "preview", "prompt"]

  connect() {
    this.zoneTarget.addEventListener("dragover", this.handleDragOver.bind(this))
    this.zoneTarget.addEventListener("dragleave", this.handleDragLeave.bind(this))
    this.zoneTarget.addEventListener("drop", this.handleDrop.bind(this))
    this.zoneTarget.addEventListener("click", () => this.inputTarget.click())
    this.inputTarget.addEventListener("change", this.handleFileSelect.bind(this))
  }

  handleDragOver(event) {
    event.preventDefault()
    this.zoneTarget.classList.add("ring-4", "ring-purple-400")
  }

  handleDragLeave(event) {
    event.preventDefault()
    this.zoneTarget.classList.remove("ring-4", "ring-purple-400")
  }

  handleDrop(event) {
    event.preventDefault()
    this.zoneTarget.classList.remove("ring-4", "ring-purple-400")
    const files = event.dataTransfer.files
    if (files.length > 0) {
      this.showPreview(files[0])
    }
  }

  handleFileSelect(event) {
    const files = event.target.files
    if (files.length > 0) {
      this.showPreview(files[0])
    }
  }

  showPreview(file) {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      this.previewTarget.src = e.target.result
      this.previewTarget.classList.remove("hidden")
      this.promptTarget.classList.add("hidden")
    }
    reader.readAsDataURL(file)
  }
}