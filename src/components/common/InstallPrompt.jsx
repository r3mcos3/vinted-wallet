import { useState, useEffect } from 'react'
import '../../styles/InstallPrompt.css'

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [platform, setPlatform] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return // Already installed
    }

    // Check if user dismissed prompt before
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (dismissed) {
      return
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isInStandaloneMode = window.navigator.standalone === true

    if (isIOS && !isInStandaloneMode) {
      // iOS Safari - show manual instructions
      setPlatform('ios')
      setShowPrompt(true)
    } else if (isAndroid) {
      // Android - wait for beforeinstallprompt event
      setPlatform('android')

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShowPrompt(true)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (platform === 'android' && deferredPrompt) {
      // Trigger native Android install prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }

      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button
          onClick={handleDismiss}
          className="install-prompt-close"
          aria-label="Sluiten"
        >
          ✕
        </button>

        <div className="install-prompt-icon">📱</div>

        {platform === 'ios' ? (
          <>
            <h3>Installeer Vinted Wallet</h3>
            <p>Installeer deze app op je iPhone voor snelle toegang en een betere ervaring.</p>

            <div className="install-steps">
              <div className="install-step">
                <span className="step-number">1</span>
                <span className="step-text">
                  Tik op het <strong>deel-icoon</strong>
                  <span className="ios-share-icon">⎙</span> onderaan je scherm
                </span>
              </div>
              <div className="install-step">
                <span className="step-number">2</span>
                <span className="step-text">
                  Scroll naar beneden en tik op <strong>"Zet op beginscherm"</strong>
                </span>
              </div>
              <div className="install-step">
                <span className="step-number">3</span>
                <span className="step-text">
                  Tik op <strong>"Voeg toe"</strong>
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3>Installeer Vinted Wallet</h3>
            <p>Installeer deze app voor snelle toegang en een betere ervaring.</p>

            <button
              onClick={handleInstall}
              className="install-button"
            >
              Installeer App
            </button>
          </>
        )}

        <button
          onClick={handleDismiss}
          className="install-dismiss"
        >
          Niet nu
        </button>
      </div>
    </div>
  )
}
