'use client'

import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onResult }: { onResult: (result: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let quagga: any = null

    async function startScan() {
      try {
        const Quagga = (await import('@ericblade/quagga2')).default
        quagga = Quagga

        await Quagga.init({
          inputStream: {
            type: 'LiveStream',
            target: scannerRef.current!,
            constraints: {
              facingMode: 'environment',
              width: { min: 640 },
              height: { min: 480 },
            },
          },
          decoder: {
            readers: ['ean_13_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader'],
          },
          locate: true,
        }, (err: any) => {
          if (err) {
            setError('Impossible d\'accéder à la caméra')
            return
          }
          Quagga.start()
          setScanning(true)
        })

        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code
          if (code) {
            onResult(code)
            Quagga.stop()
            setScanning(false)
          }
        })
      } catch (e) {
        setError('Erreur scanner')
      }
    }

    startScan()

    return () => {
      if (quagga) {
        try { quagga.stop() } catch {}
      }
    }
  }, [onResult])

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={scannerRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '250px' }} />
      {scanning && <p className="text-zinc-400 text-sm">Pointez la caméra vers le code barre...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
