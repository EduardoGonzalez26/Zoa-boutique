'use client';

import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar UNA sola vez, con locale correcto
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '';
if (PUBLIC_KEY) {
  initMercadoPago(PUBLIC_KEY, { locale: 'es-MX' });
}

interface MercadoPagoWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialization: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
}

export default function MercadoPagoWrapper({ initialization, onSubmit }: MercadoPagoWrapperProps) {
  if (!PUBLIC_KEY) {
    return (
      <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-600">
          ⚠️ MercadoPago no está configurado.<br />
          <span className="text-xs">Agrega NEXT_PUBLIC_MP_PUBLIC_KEY en .env.local</span>
        </p>
      </div>
    );
  }

  return (
    /*
     * touch-action: manipulation fixes iOS issue where iframe inputs
     * do not receive keyboard focus inside position:fixed containers.
     * The div wrapper ensures no transform/overflow clipping happens.
     */
    <div
      className="w-full mp-brick-wrapper"
      style={{
        touchAction: 'manipulation',
        position: 'relative',
      }}
    >
      {/* Inline CSS override: oculta título duplicado del Brick, aplica tipografía */}
      <style>{`
        .mp-brick-wrapper h2,
        .mp-brick-wrapper [class*="header-title"],
        .mp-brick-wrapper [class*="title--"],
        .mp-brick-wrapper [class*="PaymentType__title"],
        .mp-brick-wrapper [data-testid="header-title"] { display: none !important; }
        .mp-brick-wrapper label {
          text-transform: capitalize !important;
          font-family: var(--font-sans), system-ui, sans-serif !important;
          letter-spacing: 0.02em !important;
        }
        .mp-brick-wrapper input,
        .mp-brick-wrapper input[type="text"],
        .mp-brick-wrapper input[name*="holder"],
        .mp-brick-wrapper input[name*="name"],
        .mp-brick-wrapper input[autocomplete*="name"],
        .mp-brick-wrapper input[autocomplete*="cc-name"] {
          font-family: var(--font-sans), system-ui, sans-serif !important;
          touch-action: manipulation !important;
          -webkit-user-select: text !important;
          -webkit-user-modify: read-write-plaintext-only !important;
          user-select: text !important;
          pointer-events: auto !important;
        }
      `}</style>
      <Payment
        initialization={{
          amount: initialization.amount,
          payer: {
            // Pre-fill email to suppress the email field in the brick
            email: initialization.payer?.email ?? '',
            // Pre-fill cardholder name via firstName/lastName.
            // On iOS, the holder name input inside MP's iframe loses its value
            // when the virtual keyboard causes scroll inside a fixed drawer.
            // Result: empty cardholder_name → cc_rejected_bad_filled_other.
            // Passing the name here makes the Brick auto-populate the field.
            ...(initialization.payer?.name
              ? {
                  firstName: (initialization.payer.name as string).split(' ')[0] ?? '',
                  lastName:  (initialization.payer.name as string).split(' ').slice(1).join(' ') || '.',
                }
              : {}),
          },
        }}
        onSubmit={onSubmit}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: 'all',
            maxInstallments: 12,
          },
          visual: {
            style: { theme: 'flat' },
            hideFormTitle: true,
            hidePaymentButton: false,
          },
        }}
      />
    </div>
  );
}
