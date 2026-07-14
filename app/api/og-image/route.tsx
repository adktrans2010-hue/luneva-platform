import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fff8f6",
          color: "#332725",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid #ead7d1",
            borderRadius: "48px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            padding: "64px 76px",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#c98778",
              display: "flex",
              fontSize: 25,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Luneva Psy
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "serif",
              fontSize: 78,
              lineHeight: 1.05,
              marginTop: 28,
            }}
          >
            Лунева Александра
          </div>
          <div
            style={{
              color: "#5f5552",
              display: "flex",
              fontSize: 32,
              lineHeight: 1.35,
              marginTop: 28,
            }}
          >
            Психологическая помощь взрослым и подросткам
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              marginTop: 44,
            }}
          >
            <div
              style={{
                background: "#c98778",
                borderRadius: "50%",
                display: "flex",
                height: 14,
                width: 14,
              }}
            />
            <div
              style={{
                color: "#8a7a76",
                display: "flex",
                fontSize: 24,
                marginLeft: 16,
              }}
            >
              luneva-psy.ru
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
