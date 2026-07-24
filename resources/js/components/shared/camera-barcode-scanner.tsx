import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    onScan: (value: string) => void;
    buttonLabel?: string;
}

export default function CameraBarcodeScanner({
    onScan,
    buttonLabel = 'Scan with Camera',
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startPromiseRef = useRef<Promise<unknown> | null>(null);
    const stoppedRef = useRef(true);
    // useId() instead of useRef(Math.random()...) — Math.random() is an impure
    // call and evaluating it during render (even just to seed a ref) isn't
    // allowed under the newer react-hooks/purity rule. useId() is pure,
    // stable, SSR-safe, and returns a plain string, so no .current access
    // during render either (react-hooks/refs flagged that too).
    const rawId = useId();
    const containerId = `scanner-${rawId.replace(/:/g, '')}`;

    // The effect below only re-runs on isOpen — it must NOT restart the camera
    // just because the parent re-rendered and passed a new onScan reference
    // (e.g. an inline arrow function). This ref always holds the latest
    // onScan without making the effect depend on it.
    const onScanRef = useRef(onScan);
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    async function safeStop(scanner: Html5Qrcode) {
        if (stoppedRef.current) {
            return;
        }

        stoppedRef.current = true; // set first — if stop() throws, we still don't want to retry it

        try {
            await scanner.stop();
        } catch {
            // already stopped/never started — fine
        }
    }

    // useCallback with empty deps keeps this reference stable across renders,
    // so it's safe to include in the effect's dependency array below without
    // causing the same restart-on-every-render problem onScan would cause.
    const handleClose = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const scanner = new Html5Qrcode(containerId, {
            verbose: false,
        });
        scannerRef.current = scanner;
        stoppedRef.current = false;

        const startPromise = scanner
            .start(
                { facingMode: 'environment' }, // rear camera on phones
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    onScanRef.current(decodedText);
                    handleClose();
                },
                () => {
                    // fires continuously while no barcode is found in frame — ignore, not a real error
                },
            )
            .catch(() => {
                stoppedRef.current = true; // start() failed — nothing to stop
                setError(
                    'Could not access camera. Check permissions and try again.',
                );
            });

        startPromiseRef.current = startPromise;

        // Cleanup handles the unmount case (e.g. navigating away mid-scan). If
        // handleClose already ran (normal close button / successful scan), this
        // is a no-op thanks to the stoppedRef guard in safeStop.
        return () => {
            startPromise.then(() => safeStop(scanner));
        };
    }, [isOpen, handleClose, containerId]);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
            >
                <Camera className="size-4" />
                {buttonLabel}
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-background p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-medium">Scan Barcode</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        {error ? (
                            <p className="py-8 text-center text-sm text-red-600">
                                {error}
                            </p>
                        ) : (
                            <div
                                id={containerId}
                                className="w-full overflow-hidden rounded-lg"
                            />
                        )}

                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Point your camera at a barcode. It will scan
                            automatically.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
