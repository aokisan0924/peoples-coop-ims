import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface Props {
    onScan: (value: string) => void;
    buttonLabel?: string;
}

export default function CameraBarcodeScanner({ onScan, buttonLabel = 'Scan with Camera' }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startPromiseRef = useRef<Promise<unknown> | null>(null);
    const stoppedRef = useRef(true);
    const containerId = useRef(`scanner-${Math.random().toString(36).slice(2)}`);

    async function safeStop(scanner: Html5Qrcode) {
        if (stoppedRef.current) return;
        stoppedRef.current = true; // set first — if stop() throws, we still don't want to retry it
        try {
            await scanner.stop();
        } catch {
            // already stopped/never started — fine
        }
    }

    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5Qrcode(containerId.current, { verbose: false });
        scannerRef.current = scanner;
        stoppedRef.current = false;

        const startPromise = scanner
            .start(
                { facingMode: 'environment' }, // rear camera on phones
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    onScan(decodedText);
                    handleClose();
                },
                () => {
                    // fires continuously while no barcode is found in frame — ignore, not a real error
                }
            )
            .catch(() => {
                stoppedRef.current = true; // start() failed — nothing to stop
                setError('Could not access camera. Check permissions and try again.');
            });

        startPromiseRef.current = startPromise;

        // Cleanup handles the unmount case (e.g. navigating away mid-scan). If
        // handleClose already ran (normal close button / successful scan), this
        // is a no-op thanks to the stoppedRef guard in safeStop.
        return () => {
            startPromise.then(() => safeStop(scanner));
        };
    }, [isOpen]);

    async function handleClose() {
        // start() may still be pending (camera permission prompt, slow init) —
        // stopping before it resolves is what leaves the camera track open on
        // some mobile browsers and breaks the next scan attempt.
        if (startPromiseRef.current) {
            await startPromiseRef.current;
        }
        if (scannerRef.current) {
            await safeStop(scannerRef.current);
        }
        setIsOpen(false);
        setError('');
    }

    return (
        <>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <Camera className="size-4" />
                {buttonLabel}
            </Button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg p-4 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-medium">Scan Barcode</h2>
                            <Button variant="ghost" size="sm" onClick={handleClose}>
                                <X className="size-4" />
                            </Button>
                        </div>

                        {error ? (
                            <p className="text-sm text-red-600 py-8 text-center">{error}</p>
                        ) : (
                            <div id={containerId.current} className="w-full rounded-lg overflow-hidden" />
                        )}

                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Point your camera at a barcode. It will scan automatically.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
