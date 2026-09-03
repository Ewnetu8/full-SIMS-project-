'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Skeleton } from '@/components/feedback';
import { cn } from '@/lib';

export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export function QRCodeImage({
  value,
  size = 200,
  className,
  errorCorrectionLevel = 'M',
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!value) {
      setDataUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        setDataUrl(url);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code.');
        setIsLoading(false);
      });
  }, [value, size, errorCorrectionLevel]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-muted p-4',
          className
        )}
        style={{ width: size, height: size }}
      >
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs text-destructive',
          className
        )}
        style={{ width: size, height: size }}
      >
        <span>{error || 'No data'}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-white p-3 shadow-md ring-1 ring-border/50',
        className
      )}
    >
      <img
        src={dataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-md"
      />
    </div>
  );
}
