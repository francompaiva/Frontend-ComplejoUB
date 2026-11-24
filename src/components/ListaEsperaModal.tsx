
import React, { useEffect, useState } from 'react';
import './ListaEsperaModal.css';

export interface ListaEsperaModalProps {
  isOpen: boolean;
  courtName: string;
  date: string;
  time: string;
  onClose: () => void;
  onConfirm: (name: string, phone: string) => Promise<number>;
}

export const ListaEsperaModal: React.FC<ListaEsperaModalProps> = ({
  isOpen,
  courtName,
  date,
  time,
  onClose,
  onConfirm
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reinicia el formulario incluso si el cierre proviene del componente padre.
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhone('');
      setSubmitted(false);
      setIsSubmitting(false);
      setSubmitError(null); 
    }
  }, [isOpen]);

  if (!isOpen) return null;


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isSubmitting) return;

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    await onConfirm(name, phone);
    setSubmitted(true);
  } catch (err: unknown) {
    setSubmitError(
      err instanceof Error
        ? err.message
        : 'No se pudo completar la inscripción. Intentá nuevamente.'
    );
  } finally {
    setIsSubmitting(false);
  }
};


const handleDone = () => {
  if (isSubmitting) return;

  setName('');
  setPhone('');
  setSubmitted(false);
  setSubmitError(null);
  onClose();
};

  return (
    <div
      className="ub-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && handleDone()}
    >
      <div className="ub-modal-panel espera-modal__panel">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="espera-modal__form">
            {/* Header */}
            <div className="espera-modal__heading">
              <div className="espera-modal__clock">
                ⏳
              </div>
              <div>
                <h3 className="espera-modal__title">Lista de Espera</h3>
                <p className="espera-modal__subtitle">Aviso de cupo liberado</p>
              </div>
            </div>

            {/* Slot Details Card */}
            <div className="espera-modal__slot">
              <div className="espera-modal__detail">
                <span className="espera-modal__muted">Cancha:</span>
                <span className="espera-modal__value">{courtName}</span>
              </div>
              <div className="espera-modal__detail">
                <span className="espera-modal__muted">Horario seleccionado:</span>
                <span className="espera-modal__accent">{date} • {time}</span>
              </div>
              <div className="espera-modal__detail">
                <span className="espera-modal__muted">Estado actual:</span>
                <span className="espera-modal__occupied">
                  Turno Ocupado
                </span>
              </div>
            </div>

            <p className="espera-modal__description">
              Si el usuario actual cancela su turno con más de 24 hs de anticipación, se te notificará de inmediato para que puedas abonar la seña y confirmar la reserva.
            </p>

            {/* Inputs */}
            <div className="espera-modal__fields">
              <div>
                <label className="espera-modal__label">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="espera-modal__input"
                />
              </div>

              <div>
                <label className="espera-modal__label">
                  Teléfono / WhatsApp para aviso urgente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 11-4567-8901"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="espera-modal__input"
                />
              </div>
            </div>

            {submitError && (
              <p className="espera-modal__error" role="alert">
                {submitError}
              </p>
            )}

            {/* Action buttons */}
            <div className="espera-modal__actions">
              <button
                type="button"
                onClick={handleDone}
                className="espera-modal__action espera-modal__action--back"
              >
                Volver
              </button>
              <button
                disabled={isSubmitting}
                type="submit"
                className="espera-modal__action espera-modal__action--submit"
              >
               {isSubmitting ? 'Anotando...' : 'Anotarme'}
              </button>
            </div>
          </form>
        ) : (
          <div className="espera-modal__success">
            <div className="espera-modal__check">
              ✅
            </div>
            <h3 className="espera-modal__success-title">¡Anotado en Lista de Espera!</h3>
            <p className="espera-modal__success-text">
              Tu solicitud fue registrada correctamente en la lista de espera.
            </p>
            <p className="espera-modal__success-note">
              Recibirás una notificación en el sistema si se libera el turno
              y llega tu oportunidad de reservarlo.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="espera-modal__done"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaEsperaModal;
