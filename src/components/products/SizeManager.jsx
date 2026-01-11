import { useState, useEffect } from 'react'
import '../../styles/SizeManager.css'

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']

export function SizeManager({ value = [], onChange, existingInventory = [], isEditMode = false }) {
  const [selectedSizes, setSelectedSizes] = useState({})
  const [sizeType, setSizeType] = useState('clothing') // 'clothing' or 'shoes' or 'custom'
  const [customSize, setCustomSize] = useState('')

  const availableSizes = sizeType === 'clothing' ? CLOTHING_SIZES : SHOE_SIZES

  // Create a map of existing inventory for quick lookup
  const existingInventoryMap = new Map(
    existingInventory.map(item => [item.size, item])
  )

  // Initialize from value prop or existing inventory
  useEffect(() => {
    if (isEditMode && existingInventory.length > 0) {
      // In edit mode, initialize with existing sizes (but quantities will be 0 for "additional")
      const sizes = {}
      existingInventory.forEach(item => {
        sizes[item.size] = 0 // Start with 0 additional quantity
      })
      setSelectedSizes(sizes)
    } else if (value && value.length > 0) {
      const sizes = {}
      value.forEach(item => {
        sizes[item.size] = item.quantity || item.total_quantity || 1
      })
      setSelectedSizes(sizes)
    }
  }, [])

  const handleSizeToggle = (size) => {
    const newSizes = { ...selectedSizes }
    if (newSizes[size]) {
      delete newSizes[size]
    } else {
      newSizes[size] = 1
    }
    setSelectedSizes(newSizes)
    notifyChange(newSizes)
  }

  const handleQuantityChange = (size, quantity) => {
    const newSizes = { ...selectedSizes }
    const numQuantity = parseInt(quantity) || 0

    if (numQuantity > 0) {
      newSizes[size] = numQuantity
    } else {
      delete newSizes[size]
    }

    setSelectedSizes(newSizes)
    notifyChange(newSizes)
  }

  const notifyChange = (sizes) => {
    const sizesArray = Object.entries(sizes)
      .filter(([_, qty]) => isEditMode || qty > 0) // In edit mode, include all sizes even with 0
      .map(([size, quantity]) => {
        if (isEditMode) {
          return {
            size,
            additionalQuantity: parseInt(quantity) || 0
          }
        } else {
          return {
            size,
            quantity: parseInt(quantity)
          }
        }
      })
    onChange(sizesArray)
  }

  const handleCustomSizeAdd = () => {
    if (!customSize.trim()) return

    const size = customSize.trim()
    const newSizes = { ...selectedSizes }

    if (!newSizes[size]) {
      newSizes[size] = 1
      setSelectedSizes(newSizes)
      notifyChange(newSizes)
      setCustomSize('')
    }
  }

  const totalItems = Object.values(selectedSizes).reduce((sum, qty) => sum + qty, 0)

  return (
    <div className="size-manager">
      <div className="size-manager-header">
        <label className="size-manager-label">Maten & Hoeveelheden</label>
        {totalItems > 0 && (
          <span className="size-manager-total">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Size Type Selector */}
      <div className="size-type-selector">
        <button
          type="button"
          className={`type-button ${sizeType === 'clothing' ? 'active' : ''}`}
          onClick={() => setSizeType('clothing')}
        >
          👕 Kleding
        </button>
        <button
          type="button"
          className={`type-button ${sizeType === 'shoes' ? 'active' : ''}`}
          onClick={() => setSizeType('shoes')}
        >
          👟 Schoenen
        </button>
        <button
          type="button"
          className={`type-button ${sizeType === 'custom' ? 'active' : ''}`}
          onClick={() => setSizeType('custom')}
        >
          ✏️ Custom
        </button>
      </div>

      {/* Predefined Size Buttons */}
      {sizeType !== 'custom' && (
        <div className="size-buttons">
          {availableSizes.map(size => (
          <button
            key={size}
            type="button"
            className={`size-button ${selectedSizes[size] ? 'active' : ''}`}
            onClick={() => handleSizeToggle(size)}
          >
            {size}
            {selectedSizes[size] && (
              <span className="size-quantity-badge">{selectedSizes[size]}</span>
            )}
          </button>
        ))}
        </div>
      )}

      {/* Custom Size Input */}
      {sizeType === 'custom' && (
        <div className="custom-size-input">
          <input
            type="text"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSizeAdd()}
            placeholder="Bijv: 128, One Size, 32/34..."
            className="custom-size-field"
          />
          <button
            type="button"
            onClick={handleCustomSizeAdd}
            className="custom-size-add"
          >
            Toevoegen
          </button>
        </div>
      )}

      {Object.keys(selectedSizes).length > 0 && (
        <div className="size-quantities">
          <div className="size-quantities-header">
            {isEditMode ? 'Voorraad Aanvullen' : 'Hoeveelheden'}
          </div>
          <div className="size-quantity-grid">
            {Object.entries(selectedSizes).map(([size, quantity]) => {
              const existingItem = existingInventoryMap.get(size)
              return (
                <div key={size} className="size-quantity-item">
                  <div className="size-quantity-header">
                    <label className="size-quantity-label">Maat {size}</label>
                    {isEditMode && existingItem && (
                      <div className="size-current-stock">
                        <span className="stock-total">{existingItem.total_quantity} totaal</span>
                        <span className="stock-divider">•</span>
                        <span className="stock-sold">{existingItem.sold_quantity} verkocht</span>
                        <span className="stock-divider">•</span>
                        <span className="stock-available">
                          {existingItem.total_quantity - existingItem.sold_quantity} beschikbaar
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    min={isEditMode ? "0" : "1"}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(size, e.target.value)}
                    className="size-quantity-input"
                    placeholder={isEditMode ? "Toevoegen..." : "Aantal"}
                  />
                  {isEditMode && quantity > 0 && existingItem && (
                    <div className="size-new-total">
                      → Nieuw totaal: {existingItem.total_quantity + parseInt(quantity)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {Object.keys(selectedSizes).length === 0 && (
        <div className="size-manager-hint">
          Selecteer maten door op de knoppen hierboven te klikken
        </div>
      )}
    </div>
  )
}
