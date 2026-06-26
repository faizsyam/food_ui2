export default function MobileCheckoutBar({
  grandTotal,
  checkoutReady,
  onConfirm,
}) {
  const formattedTotal = grandTotal?.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

  return (
    <div
      className="fixed bottom-0 inset-x-0 flex items-center justify-between"
      style={{
        height: 64,
        backgroundColor: "white",
        borderTop: "1px solid #EFEFED",
        padding: "0 16px",
        zIndex: 50,
      }}
    >
      <div className="flex flex-col">
        <span style={{ fontSize: 12, color: "#6B6B67" }}>Total</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111111" }}>
          {formattedTotal}
        </span>
      </div>

      usando {/* Note: button uses bg style for color to allow dynamic disabled state */}
      <button
        disabled={!checkoutReady}
        onClick={onConfirm}
        className="border-0"
        style={{
          backgroundColor: checkoutReady ? "#E8521A" : "#D1D5DB",
          color: "white",
          fontSize: 15,
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: 8,
          cursor: checkoutReady ? "pointer" : "not-allowed",
        }}
        title={
          checkoutReady
            ? ""
            : "Resolve issues above to continue"
        }
      >
        Confirm order
      </button>
    </div>
  );
}
