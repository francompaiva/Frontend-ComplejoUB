
import React, { useEffect, useState } from 'react';
import './ConfirmacionPagoModal.css';

export interface BookingSlotInfo {
  court: string;
  courtId?: string;
  sport?: string;
  date: string;
  time: string;
  price?: number;
}

export interface ConfirmacionPagoModalProps {
  isOpen: boolean;
  slot: BookingSlotInfo | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const ConfirmacionPagoModal: React.FC<ConfirmacionPagoModalProps> = ({
  isOpen,
  slot,
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState<'tarjeta' | 'mercadopago'>('tarjeta');
  const [cardNum, setCardNum] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Limpia también cuando el componente se cierra desde App.tsx,
  // por ejemplo después de confirmar la reserva.
  useEffect(() => {
    if (!isOpen) {
      setMethod('tarjeta');
      setCardNum('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      setCardError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Los cierres manuales limpian los campos inmediatamente.
  const handleClose = () => {
    setMethod('tarjeta');
    setCardNum('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setCardError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen || !slot) return null;

  const totalPrice = slot.price || 18000;
  const deposit = Math.round(totalPrice * 0.3);
  const remaining = totalPrice - deposit;

  const handlePay = async () => {
    setCardError(null);
    if (method === 'tarjeta') {
      if (!cardNum.trim() || !cardHolder.trim()) {
        setCardError('Por favor ingresa el número de tarjeta y el nombre del titular para continuar.');
        return;
      }
    }
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setCardError(err?.message || 'No se pudo completar la reserva en la base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="ub-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="ub-modal-panel pago-modal__panel">
        {/* Header */}
        <div className="pago-modal__header">
          <div className="pago-modal__heading">
            <div className="pago-modal__dot" />
            <h3 className="pago-modal__title">
              Confirmación y Pago de Seña (30%)
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="pago-modal__close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="pago-modal__body">
          {/* Reservation Breakdown */}
          <div className="pago-modal__breakdown">
            <div className="pago-modal__detail">
              <span className="pago-modal__muted">Instalación:</span>
              <span className="pago-modal__bold">{slot.court}</span>
            </div>
            <div className="pago-modal__detail">
              <span className="pago-modal__muted">Fecha y Hora:</span>
              <span className="pago-modal__accent">{slot.date} • {slot.time}</span>
            </div>
            <div className="pago-modal__detail">
              <span className="pago-modal__muted">Duración:</span>
              <span className="pago-modal__medium">1 hora fija</span>
            </div>
            <div className="pago-modal__rule" />
            <div className="pago-modal__detail">
              <span className="pago-modal__muted">Tarifa fija total:</span>
              <span className="pago-modal__semibold">${totalPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="pago-modal__deposit">
              <span className="pago-modal__deposit-label">Seña a abonar hoy (30%):</span>
              <span className="pago-modal__deposit-amount">${deposit.toLocaleString('es-AR')}</span>
            </div>
            <div className="pago-modal__balance">
              <span>Saldo a cancelar en mesa de entrada (70%):</span>
              <span className="pago-modal__medium">${remaining.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="pago-modal__payment-label">
              Medio de Pago (Simulación Aprobada)
            </label>
            <div className="pago-modal__method-grid">
              <button
                type="button"
                onClick={() => setMethod('tarjeta')}
                className={`pago-modal__method${method === 'tarjeta' ? ' is-active' : ''}`}
              >
                <span>💳</span> Tarjeta Crédito/Débito
              </button>
              <button
                type="button"
                onClick={() => setMethod('mercadopago')}
                className={`pago-modal__method${method === 'mercadopago' ? ' is-active' : ''}`}
              >
                <span>📱</span> Mercado Pago
              </button>
            </div>
          </div>

          {/* Card Form */}
          {method === 'tarjeta' && (
            <div className="pago-modal__card-form">
              <div>
                <span className="pago-modal__input-label">Número de tarjeta</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="•••• •••• •••• 4242"
                  value={cardNum}
                  onChange={(e) => {
                    const numeros = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 16);

                    const formateado = numeros
                      .replace(/(.{4})/g, '$1 ')
                      .trim();

                    setCardNum(formateado);
                  }}
                  className="pago-modal__input"
                />
              </div>
              <div className="pago-modal__field-row">
                <div className="pago-modal__field-fill">
                  <span className="pago-modal__input-label">Titular</span>
                  <input
                    type="text"
                    placeholder="JUAN PEREZ"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="pago-modal__input"
                  />
                </div>
                <div className="pago-modal__field-expiry">
                  <span className="pago-modal__input-label">Vencimiento</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => {
                      const valor = e.target.value;
                      const numeros = valor.replace(/\D/g, '').slice(0, 4);

                      // Permitir borrar la barra con Backspace.
                      if (
                        valor.length < cardExpiry.length &&
                        cardExpiry.endsWith('/') &&
                        numeros.length === 2
                      ) {
                        setCardExpiry(numeros);
                        return;
                      }

                      const formateado =
                        numeros.length >= 2
                          ? `${numeros.slice(0, 2)}/${numeros.slice(2)}`
                          : numeros;

                      setCardExpiry(formateado);
                    }}
                    className="pago-modal__input pago-modal__input--center"
                  />
                </div>
                <div className="pago-modal__field-cvv">
                  <span className="pago-modal__input-label">CVV</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="pago-modal__input pago-modal__input--center"
                  />
                </div>
              </div>
            </div>
          )}

          {cardError && (
            <div className="pago-modal__error">
              <span>⚠️</span>
              <span>{cardError}</span>
            </div>
          )}

          {/* Scope notice */}
          <p className="pago-modal__notice">
            * La seña se procesa de manera inmediata y segura para confirmar tu reserva en el sistema.
          </p>

          {/* Actions */}
          <div className="pago-modal__actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="pago-modal__action pago-modal__action--cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="pago-modal__action pago-modal__action--pay"
            >
              {isProcessing ? 'Procesando seña...' : `Pagar Seña $${deposit.toLocaleString('es-AR')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionPagoModal;
