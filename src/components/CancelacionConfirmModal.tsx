import React from 'react';
import { IconUndo, IconAlert, IconCheck } from './Icons';

export interface CancelacionConfirmModalProps {
  isOpen: boolean;
  bookingName?: string;
  isRefundable?: boolean;
  hoursUntilMatch?: number;
  depositAmount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelacionConfirmModal: React.FC<CancelacionConfirmModalProps> = ({
  isOpen,
  bookingName,
  isRefundable = false,
  hoursUntilMatch,
  depositAmount = 5400,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[440px] shadow-2xl overflow-hidden text-slate-900 font-['Inter',sans-serif]">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`size-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                isRefundable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {isRefundable ? <IconUndo size={22} /> : <IconAlert size={22} />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">¿Confirmar cancelación del turno?</h3>
              <p className="text-xs text-slate-500">Política oficial de cancelaciones y señas</p>
            </div>
          </div>

          {bookingName && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Turno seleccionado</span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{bookingName}</p>
            </div>
          )}

          {isRefundable ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <IconCheck size={15} className="text-emerald-600 shrink-0" />
                <span>
                  Reintegro total de seña {hoursUntilMatch !== undefined ? `(${Math.round(hoursUntilMatch)} hs de anticipación)` : ''}
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Corresponde la <strong>devolución íntegra de la seña abonada</strong> según la política del complejo (&gt;24 hs). Se acreditará a tu medio de pago original.
              </p>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-emerald-200/70">
                <span className="text-emerald-800 font-medium">Monto a reintegrar:</span>
                <span className="font-extrabold text-sm text-emerald-700">
                  ${depositAmount.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                <IconAlert size={15} className="text-red-600 shrink-0" />
                <span>
                  Retención de seña {hoursUntilMatch !== undefined ? `(${Math.max(0, Math.round(hoursUntilMatch))} hs restantes)` : ''}
                </span>
              </div>
              <p className="text-xs text-red-800/90 leading-relaxed">
                Por cancelarse con menos de 24 horas de antelación, <strong>la seña de ${depositAmount.toLocaleString('es-AR')} no será reintegrada</strong> y queda retenida como compensación por el turno.
              </p>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Al confirmar, la cancha volverá a figurar como disponible inmediatamente para todos los usuarios.
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Mantener turno
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-white ${
              isRefundable
                ? 'bg-[#199e1b] hover:bg-[#158417]'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Sí, cancelar turno
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelacionConfirmModal;
