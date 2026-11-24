
import React from 'react';
import { createPortal } from 'react-dom';
import './CancelacionConfirmModal.css';

export interface CancelacionConfirmModalProps {
  isOpen: boolean;
  bookingName?: string;
  isRefundable?: boolean;
  hoursUntilMatch?: number;
  depositAmount?: number;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelacionConfirmModal: React.FC<
  CancelacionConfirmModalProps
> = ({
  isOpen,
  bookingName,
  isRefundable = false,
  hoursUntilMatch,
  depositAmount = 5400,
  errorMessage = null,
  isSubmitting = false,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  const horasRestantes =
    hoursUntilMatch !== undefined
      ? Math.max(0, Math.round(hoursUntilMatch))
      : null;

  const montoFormateado = depositAmount.toLocaleString('es-AR');

  return createPortal(
    <div
      className="ub-modal-backdrop cancelacion-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="ub-modal-panel cancelacion-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelacion-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <header className="cancelacion-modal__header">
          <div className="cancelacion-modal__heading">
            <span
              className={`cancelacion-modal__icon ${
                isRefundable
                  ? 'cancelacion-modal__icon--refund'
                  : 'cancelacion-modal__icon--warning'
              }`}
              aria-hidden="true"
            >
              {isRefundable ? '↩' : '!'}
            </span>

            <div>
              <h2
                id="cancelacion-modal-title"
                className="cancelacion-modal__title"
              >
                ¿Confirmar cancelación?
              </h2>

              <p className="cancelacion-modal__subtitle">
                Política de cancelaciones
              </p>
            </div>
          </div>

          <button
            type="button"
            className="cancelacion-modal__close"
            onClick={onClose}
            aria-label="Cerrar ventana"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </header>

        {/* CONTENIDO */}
        <div className="cancelacion-modal__body">
          {bookingName && (
            <div className="cancelacion-modal__booking">
              <span className="cancelacion-modal__label">
                TURNO SELECCIONADO
              </span>

              <strong>{bookingName}</strong>
            </div>
          )}

          {isRefundable ? (
            <div className="cancelacion-modal__notice cancelacion-modal__notice--refund">
              <h3>
                ✓ Reintegro total de la seña
              </h3>

              {horasRestantes !== null && (
                <p className="cancelacion-modal__hours">
                  Anticipación: {horasRestantes} horas
                </p>
              )}

              <p>
                Corresponde la devolución íntegra de la seña
                abonada, según la política del complejo para
                cancelaciones con más de 24 horas de anticipación.
              </p>

              <div className="cancelacion-modal__amount">
                <span>Monto a reintegrar</span>
                <strong>${montoFormateado}</strong>
              </div>
            </div>
          ) : (
            <div className="cancelacion-modal__notice cancelacion-modal__notice--warning">
              <h3>
                ! Seña no reembolsable
              </h3>

              {horasRestantes !== null && (
                <p className="cancelacion-modal__hours">
                  Anticipación: {horasRestantes} horas
                </p>
              )}

              <p>
                Al cancelar con menos de 24 horas de
                anticipación, la seña abonada no será
                reintegrada.
              </p>

              <div className="cancelacion-modal__amount">
                <span>Seña retenida</span>
                <strong>${montoFormateado}</strong>
              </div>
            </div>
          )}

          <p className="cancelacion-modal__description">
            Al confirmar, el turno se liberará para que otros
            usuarios puedan reservarlo.
          </p>

          {errorMessage && (
            <div
              className="cancelacion-modal__notice cancelacion-modal__notice--warning"
              role="alert"
            >
              <h3>No se pudo confirmar la cancelación</h3>
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* PIE DE LA VENTANA */}
        <footer className="cancelacion-modal__footer">
          <button
            type="button"
            className="cancelacion-modal__button cancelacion-modal__button--back"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Mantener turno
          </button>

          <button
            type="button"
            className={`cancelacion-modal__button ${
              isRefundable
                ? 'cancelacion-modal__button--confirm'
                : 'cancelacion-modal__button--danger'
            }`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cancelando...' : 'Cancelar turno'}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
};

export default CancelacionConfirmModal;
