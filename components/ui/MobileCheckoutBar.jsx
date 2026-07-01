export default function MobileCheckoutBar({ grandTotal, checkoutReady, onConfirm }) {
  const formattedTotal = grandTotal?.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  return (
    <div
      className="fixed bottom-0 inset-x-0 flex items-center justify-between bg-white border-t border-[#F0E8E2] z-50 px-5 h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-col">
        <span className="text-[12px] text-[#9C8E84] font-medium">Total</span>
        <span className="text-[16px] font-bold text-[#1A120D] tabular-nums">
          {formattedTotal}
        </span>
      </div>

      <button
        disabled={!checkoutReady}
        onClick={onConfirm}
        className="px-6 py-2.5 bg-[#E8521A] text-white text-[14px] font-semibold rounded-xl
          hover:bg-[#D4491A] active:scale-[0.97] transition-all duration-200
          disabled:bg-[#E0D4CA] disabled:text-white/60 disabled:cursor-not-allowed"
        title={
          checkoutReady ? '' : 'Resolve issues above to continue'
        }
      >
        Confirm order
      </button>
    </div>
  );
}
