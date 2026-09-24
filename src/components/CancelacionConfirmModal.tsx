import React from 'react';

export interface CancelacionConfirmModalProps {
  isOpen: boolean;
  bookingName?: string;
  hoursUntilMatch?: number;
  depositAmount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelacionConfirmModal: React.FC<CancelacionConfirmModalProps> = ({
  isOpen,
  bookingName,
  hoursUntilMatch = 48,
  depositAmount = 5400,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  const isRefundable = hoursUntilMatch > 24;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#1e281d] rounded-[16px] border border-[#5a7056] w-full max-w-[440px] shadow-[0px_20px_25px_rgba(0,0,0,0.5)] overflow-hidden text-white font-['Inter',sans-serif]"
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        <div className="px-[28px] pt-[28px] pb-[20px] flex flex-col gap-[14px]">
          {/* Header icon badge */}
          <div className="flex items-center gap-[12px]">
            <div
              className={`size-[48px] rounded-full flex items-center justify-center text-[24px] border ${
                isRefundable
                  ? 'bg-[rgba(101,197,86,0.15)] border-[rgba(101,197,86,0.3)] text-[#65c556]'
                  : 'bg-[rgba(229,62,62,0.15)] border-[rgba(229,62,62,0.3)] text-[#e53e3e]'
              }`}
            >
              {isRefundable ? '↩️' : '⚠️'}
            </div>
            <div>
              <h3 className="font-bold text-[18px] text-white">¿Confirmar Cancelación?</h3>
              <p className="text-[12px] text-[#a0a0a0]">Política de Cancelaciones</p>
            </div>
          </div>

          {bookingName && (
            <div className="bg-[#293827] rounded-[8px] p-[12px] border border-[#5a7056]">
              <span className="text-[11px] text-[#a0a0a0] block uppercase font-medium">Turno seleccionado</span>
              <p className="font-bold text-[14px] text-white mt-0.5">{bookingName}</p>
            </div>
          )}

          {/* 24-hour verification block */}
          {isRefundable ? (
            <div className="bg-[rgba(101,197,86,0.12)] border border-[#65c556] rounded-[10px] p-[14px] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[#65c556] font-bold text-[13px]">
                <span>✓ Anticipación mayor a 24 horas</span>
              </div>
              <p className="text-[12px] text-[#c0c0c0] leading-relaxed">
                Corresponde la <strong>devolución íntegra de la seña abonada</strong>. Se acreditará a tu medio de pago original.
              </p>
              <div className="flex justify-between items-center text-[13px] pt-1 border-t border-[rgba(101,197,86,0.2)]">
                <span className="text-[#a0a0a0]">Monto a reintegrar:</span>
                <span className="font-extrabold text-[15px] text-[#65c556]">
                  ${depositAmount.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[rgba(229,62,62,0.12)] border border-[#e53e3e] rounded-[10px] p-[14px] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[#e53e3e] font-bold text-[13px]">
                <span>⚠️ Anticipación menor a 24 horas</span>
              </div>
              <p className="text-[12px] text-[#c0c0c0] leading-relaxed">
                Por cancelarse con menos de 24 horas de antelación, <strong>la seña de ${depositAmount.toLocaleString('es-AR')} no será devuelta</strong> y queda como compensación por el turno no ocupado.
              </p>
            </div>
          )}

          <p className="text-[11px] text-[#a0a0a0]">
            Al confirmar, el turno se liberará de inmediato para los usuarios en lista de espera y el público general.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[10px] px-[28px] pb-[24px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[8px] border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            No, mantener turno
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-[8px] font-bold text-xs transition-colors cursor-pointer ${
              isRefundable
                ? 'bg-[#65c556] hover:bg-[#57ef40] text-[#293827]'
                : 'bg-[#e53e3e] hover:bg-[#c53030] text-white'
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
