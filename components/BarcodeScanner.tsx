'use client'

import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onResult }: { onResult: (result: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let codeReader: any = null

    async function startScan() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        codeReader = new BrowserMultiFormatReader()
        setScanning(true)
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result: any, err: any) => {
            if (result) {
              onResult(result.getText())
              codeReader.reset()
              setScanning(false)
            }
          }
        )
      } catch (e) {
        setError('Impossible d\'accéder à la caméra')
      }
    }

    startScan()

    return () => {
      if (codeReader) codeReader.reset()
    }
  }, [onResult])

  return (
    <div className="flex flex-col items-center gap-3">
      <video ref={videoRef} className="w-full rounded-lg" />
      {scanning && <p className="text-zinc-400 text-sm">Pointez la caméra vers le code barre de la boîte...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
