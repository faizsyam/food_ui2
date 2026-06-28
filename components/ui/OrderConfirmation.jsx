import { CheckCircle, MapPin, Clock, Truck, User } from "lucide-react";
import { formatIDR } from "../../lib/format";

export default function OrderConfirmation({ schema, onStartNewOrder }) {
  const orderItems = schema?.order?.items || [];
  const orderSummary = schema?.order_summary || {};
  const restaurantBreakdown = orderSummary.restaurant_breakdown || [];
  const grandTotal = orderSummary.grand_total || 0;
  const deliveryInfo = schema?.deliveryInfo;

  // Group items by restaurant
  const itemsByRestaurant = {};
  for (const item of orderItems) {
    const rid = item.restaurant_id || 'unknown';
    if (!itemsByRestaurant[rid]) {
      itemsByRestaurant[rid] = {
        restaurant_id: rid,
        restaurant_name: item.restaurant_name || 'Unknown Restaurant',
        items: [],
      };
    }
    itemsByRestaurant[rid].items.push(item);
  }

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
          {deliveryInfo && (
            <div style={{ marginBottom: 16 }}>
              {deliveryInfo.arrivalTime && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    fontSize: 14,
                    color: "#1A120D",
                    marginBottom: 4,
                  }}
                >
                  <Clock size={14} className="text-[#9C8E84]" />
                  Arriving: {deliveryInfo.arrivalTime}
                </div>
              )}
              {deliveryInfo.address && (
                <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#5C4F48" }}>
                  <MapPin size={14} className="text-[#9C8E84]" />
                  {deliveryInfo.address}
                </div>
              )}
            </div>
          )}

          {/* Per-restaurant item list */}
          {Object.values(itemsByRestaurant).length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              {Object.values(itemsByRestaurant).map((restGroup) => (
                <div key={restGroup.restaurant_id} style={{ marginBottom: 16 }}>
                  {/* Restaurant header */}
                  <div
                    className="flex items-center gap-2"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1A120D",
                      padding: "8px 0",
                      borderBottom: "1px solid #F0E8E2",
                    }}
                  >
                    <Truck size={14} className="text-[#E8521A]" />
                    {restGroup.restaurant_name}
                  </div>
                  {/* Items */}
                  {restGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between"
                      style={{
                        fontSize: 13,
                        padding: "6px 0",
                        borderBottom: "1px solid #F0E8E2",
                      }}
                    >
                      <div className="flex-1">
                        <span style={{ color: "#1A120D" }}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.variant && (
                          <span style={{ color: "#9C8E84", marginLeft: 4 }}>
                            ({item.variant})
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <User size={10} className="text-[#9C8E84]" />
                          <span style={{ color: "#9C8E84", fontSize: 12 }}>
                            {item.person_name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <span style={{ color: "#5C4F48", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {formatIDR(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Restaurant breakdown totals */}
              {restaurantBreakdown.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {restaurantBreakdown.map((r) => (
                    <div
                      key={r.restaurant_id}
                      className="flex justify-between"
                      style={{
                        fontSize: 13,
                        padding: "4px 0",
                      }}
                    >
                      <span style={{ color: "#5C4F48" }}>
                        Subtotal — {r.restaurant_name || r.restaurant_id}
                      </span>
                      <span style={{ color: "#1A120D", fontWeight: 500 }}>
                        {formatIDR(r.items_subtotal)}
                      </span>
                    </div>
                  ))}
                  {restaurantBreakdown.some((r) => r.delivery_fee > 0) && (
                    <>
                      {restaurantBreakdown.map((r) =>
                        r.delivery_fee > 0 ? (
                          <div
                            key={`delivery-${r.restaurant_id}`}
                            className="flex justify-between"
                            style={{
                              fontSize: 13,
                              padding: "4px 0",
                            }}
                          >
                            <span style={{ color: "#5C4F48" }}>
                              Delivery — {r.restaurant_name || r.restaurant_id}
                            </span>
                            <span style={{ color: "#1A120D", fontWeight: 500 }}>
                              {formatIDR(r.delivery_fee)}
                            </span>
                          </div>
                        ) : null
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: "#9C8E84", textAlign: "center", padding: "16px 0" }}>
              No items in order.
            </p>
          )}

          {/* Grand total */}
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
            <span>{formatIDR(grandTotal)}</span>
          </div>
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
