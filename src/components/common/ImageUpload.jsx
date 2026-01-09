import { useState, useRef } from 'react'
import '../../styles/ImageUpload.css'

export function ImageUpload({ value, onChange, disabled }) {
  const [preview, setPreview] = useState(value || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file) => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan')
      return
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Afbeelding moet kleiner zijn dan 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Pass file to parent
    onChange(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="image-upload-input"
      />

      {!preview ? (
        <div
          className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="dropzone-icon">📸</div>
          <div className="dropzone-text">
            <strong>Klik om een foto te uploaden</strong>
            <span>of sleep hier een afbeelding naartoe</span>
          </div>
          <div className="dropzone-hint">PNG, JPG, GIF tot 5MB</div>
        </div>
      ) : (
        <div className="image-upload-preview">
          <img src={preview} alt="Preview" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="image-remove-button"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
