import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ImageUpload } from '../common/ImageUpload'
import { SizeManager } from './SizeManager'
import '../../styles/ProductForm.css'

export function ProductForm({ product, onSubmit, loading }) {
  const navigate = useNavigate()
  const isEditMode = !!product
  const [formData, setFormData] = useState({
    name: '',
    purchase_price: '',
    purchase_date: new Date(), // Today's date as Date object
    notes: '',
    image: null,
    quantity: '',
    additionalQuantity: '', // For adding new stock in edit mode
    sizes: []
  })

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        purchase_price: product.purchase_price || '',
        purchase_date: product.purchase_date ? new Date(product.purchase_date) : new Date(),
        notes: product.notes || '',
        image: product.image_url || null,
        quantity: '', // Will be shown as readonly current inventory
        additionalQuantity: '', // New stock to add
        sizes: [] // Will be handled by SizeManager in edit mode
      })
    }
  }, [product])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (file) => {
    setFormData(prev => ({
      ...prev,
      image: file
    }))
  }

  const handleSizesChange = (sizes) => {
    setFormData(prev => ({
      ...prev,
      sizes
    }))
  }

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      purchase_date: date
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      alert('Productnaam is verplicht')
      return
    }

    if (!formData.purchase_price || formData.purchase_price <= 0) {
      alert('Inkoopprijs moet groter zijn dan 0')
      return
    }

    let finalData = { ...formData }

    if (isEditMode) {
      // In edit mode, we're adding stock, not setting totals
      if (formData.sizes.length === 0) {
        // Simple quantity mode - use additionalQuantity
        const additionalQty = parseInt(formData.additionalQuantity) || 0
        if (additionalQty > 0) {
          finalData.sizes = [{
            size: 'One Size',
            additionalQuantity: additionalQty
          }]
        } else {
          // No new stock being added, just update product details
          finalData.sizes = []
        }
      }
      // else: sizes are handled by SizeManager with additionalQuantity per size
    } else {
      // Create mode - use quantity as total
      if (formData.sizes.length === 0) {
        if (!formData.quantity || formData.quantity <= 0) {
          alert('Vul aantal in of selecteer maten')
          return
        }
        // Create a "One Size" entry with the quantity
        finalData.sizes = [{
          size: 'One Size',
          quantity: parseInt(formData.quantity)
        }]
      }
    }

    // Format date as YYYY-MM-DD for database
    finalData.purchase_date = formData.purchase_date.toISOString().split('T')[0]

    onSubmit(finalData)
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="product-form-section">
        <h3 className="section-title">Product Foto</h3>
        <ImageUpload
          value={formData.image}
          onChange={handleImageChange}
          disabled={loading}
        />
      </div>

      <div className="product-form-section">
        <h3 className="section-title">Product Details</h3>

        <div className="form-field">
          <label htmlFor="name" className="field-label">
            Productnaam <span className="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="bijv. Nike T-Shirt Wit"
            className="field-input"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="purchase_price" className="field-label">
              Inkoopprijs <span className="required">*</span>
            </label>
            <div className="field-input-wrapper">
              <span className="input-prefix">€</span>
              <input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={handleChange}
                disabled={loading}
                placeholder="0.00"
                className="field-input with-prefix"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="purchase_date" className="field-label">
              Inkoopdatum <span className="required">*</span>
            </label>
            <DatePicker
              id="purchase_date"
              selected={formData.purchase_date}
              onChange={handleDateChange}
              dateFormat="dd-MM-yyyy"
              disabled={loading}
              className="field-input"
              required
              placeholderText="dd-mm-yyyy"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
            <div className="field-hint">
              Retour mogelijk tot 30 dagen na aankoop
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="notes" className="field-label">
            Notities
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            placeholder="Extra informatie over dit product..."
            className="field-textarea"
            rows="3"
          />
        </div>
      </div>

      <div className="product-form-section">
        <h3 className="section-title">Voorraad</h3>

        {isEditMode ? (
          // Edit mode: Show current inventory and field to add new stock
          <>
            {product.product_sizes?.length === 1 && product.product_sizes[0].size === 'One Size' ? (
              // Simple quantity mode
              <div className="form-field">
                <div className="current-inventory">
                  <div className="inventory-label">Huidige voorraad:</div>
                  <div className="inventory-stats">
                    <span className="stat-item">
                      <strong>{product.product_sizes[0].total_quantity}</strong> totaal
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item sold">
                      {product.product_sizes[0].sold_quantity} verkocht
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item available">
                      {product.product_sizes[0].total_quantity - product.product_sizes[0].sold_quantity} beschikbaar
                    </span>
                  </div>
                </div>
                <label htmlFor="additionalQuantity" className="field-label">
                  Nieuwe voorraad toevoegen
                </label>
                <input
                  id="additionalQuantity"
                  name="additionalQuantity"
                  type="number"
                  min="0"
                  value={formData.additionalQuantity}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="bijv. 5"
                  className="field-input"
                />
                <div className="field-hint">
                  {formData.additionalQuantity > 0 ?
                    `✓ Nieuw totaal: ${product.product_sizes[0].total_quantity + parseInt(formData.additionalQuantity)} stuks` :
                    'Laat leeg als je geen nieuwe voorraad toevoegt'
                  }
                </div>
              </div>
            ) : (
              // Multi-size mode
              <div className="form-field">
                <label className="field-label">
                  Maten & Voorraad Aanvullen
                </label>
                <SizeManager
                  value={formData.sizes}
                  onChange={handleSizesChange}
                  existingInventory={product.product_sizes}
                  isEditMode={true}
                />
                <div className="field-hint">
                  Vul per maat in hoeveel nieuwe voorraad je wilt toevoegen
                </div>
              </div>
            )}
          </>
        ) : (
          // Create mode: Original behavior
          <>
            <div className="form-field">
              <label htmlFor="quantity" className="field-label">
                Aantal (als je geen specifieke maten hebt)
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                disabled={loading || formData.sizes.length > 0}
                placeholder="bijv. 5"
                className="field-input"
              />
              <div className="field-hint">
                {formData.sizes.length > 0 ?
                  '⚠️ Je hebt maten geselecteerd, aantal wordt genegeerd' :
                  'Vul dit in als je product geen specifieke maten heeft'
                }
              </div>
            </div>

            <div className="form-divider">
              <span>OF</span>
            </div>

            <div className="form-field">
              <label className="field-label">
                Maten & Hoeveelheden per maat
              </label>
              <SizeManager
                value={formData.sizes}
                onChange={handleSizesChange}
              />
              <div className="field-hint">
                Selecteer maten als je product in verschillende maten komt
              </div>
            </div>
          </>
        )}
      </div>

      <div className="product-form-actions">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={loading}
          className="form-button secondary"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={loading}
          className="form-button primary"
        >
          {loading ? 'Bezig...' : product ? 'Opslaan' : 'Product Toevoegen'}
        </button>
      </div>
    </form>
  )
}
