import { CheckCircle } from "lucide-react";

export default function OrderConfirmation({ schema, restaurants, onStartNewOrder }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{ padding: "0 16px" }}
    >
      <div className="w-full" style={{ maxWidth: 480 }}>
        <div className="flex flex-col items-center text-center">
          <CheckCircle
            size={48}
            color="#16A34A"
            style={{
              animation: "scale-in 0.4s ease-out forwards",
            }}
          />

          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#111111",
              marginTop: 16,
            }}
          >
            Your order is placed!
          </h1>

          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "#6B6B67",
              marginTop: 8,
            }}
          >
            Sit tight — your food is on its way.
          </p>
        </div>

        {/* Order Summary Card */}
        <div
          style={{
            backgroundColor: "#F7F7F5",
            borderRadius: 12,
            padding: 20,
            marginTop: 24,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111111",
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
                    color: "#111111",
                    marginBottom: 4,
                  }}
                >
                  Arriving: {schema.deliveryInfo.arrivalTime}
                </div>
              )}
              {schema.deliveryInfo.address && (
                <div style={{ fontSize: 13, color: "#6B6B67" }}>
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
                    borderBottom: "1px solid #EFEFED",
                  }}
                >
                  <span style={{ color: "#111111" }}>{r.name}</span>
                  <span style={{ color: "#6B6B67" }}>
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
                fontWeight: 600,
                color: "#111111",
                paddingTop: 8,
                borderTop: "2px solid #111111",
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
            backgroundColor: "#111111",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            height: 48,
            borderRadius: 8,
            marginTop: 24,
            cursor: "pointer",
          }}
        >
          Start a new order
        </button>
      </div>
    </div>
  );
}
