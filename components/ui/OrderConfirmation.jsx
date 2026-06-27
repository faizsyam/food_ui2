import { CheckCircle } from "lucide-react";

export default function OrderConfirmation({ schema, restaurants, onStartNewOrder }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen w-full bg-[#FFF9F5]"
      style={{ padding: "0 16px" }}
    >
      <div className="w-full" style={{ maxWidth: 480 }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-4">
            <CheckCircle
              size={32}
              className="text-[#22A65E]"
              style={{
                animation: "scale-in 0.4s ease-out forwards",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1A120D",
              marginTop: 16,
            }}
          >
            Your order is placed!
          </h1>

          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "#5C4F48",
              marginTop: 8,
            }}
          >
            Sit tight — your food is on its way.
          </p>
        </div>

        {/* Order Summary Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #F0E8E2",
            borderRadius: 16,
            padding: 20,
            marginTop: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1A120D",
              marginBottom: 12,
            }}
          >
            Order summary
          </h2>

          {/* Delivery info */}
          {schema?.deliveryInfo && (
            <div style={{ marginBottom: 16 }}>
              {schema.deliveryInfo.arrivalTime && (
                <div
                  style={{
                    fontSize: 14,
                    color: "#1A120D",
                    marginBottom: 4,
                  }}
                >
                  Arriving: {schema.deliveryInfo.arrivalTime}
                </div>
              )}
              {schema.deliveryInfo.address && (
                <div style={{ fontSize: 13, color: "#5C4F48" }}>
                  {schema.deliveryInfo.address}
                </div>
              )}
            </div>
          )}

          {/* Per-restaurant list */}
          {restaurants && restaurants.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {restaurants.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between"
                  style={{
                    fontSize: 14,
                    padding: "6px 0",
                    borderBottom: "1px solid #F0E8E2",
                  }}
                >
                  <span style={{ color: "#1A120D" }}>{r.name}</span>
                  <span style={{ color: "#5C4F48" }}>
                    {r.subtotal?.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Grand total */}
          {schema?.grandTotal !== undefined && (
            <div
              className="flex justify-between"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1A120D",
                paddingTop: 8,
                borderTop: "2px solid #1A120D",
              }}
            >
              <span>Total</span>
              <span>
                {schema.grandTotal.toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Start a new order button */}
        <button
          onClick={onStartNewOrder}
          className="w-full border-0"
          style={{
            backgroundColor: "#E8521A",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            height: 48,
            borderRadius: 12,
            marginTop: 24,
            cursor: "pointer",
            transition: "all 200ms",
          }}
        >
          Start a new order
        </button>
      </div>
    </div>
  );
}
