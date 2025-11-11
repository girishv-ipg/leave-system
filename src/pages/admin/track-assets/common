// Shared helpers: money, date, status chip, summary tile theme

export const money = (n) =>
  `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const yyyyMmDd = (d) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

// Status chip visual mapping used in table + elsewhere
export function chipForStatus(status) {
  switch (status) {
    case "Active":
      return {
        label: "Active",
        sx: {
          background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
          color: "#1a7f37",
          border: "1px solid #1a7f3720",
          fontWeight: 600,
        },
      };
    case "In Maintenance":
      return {
        label: "In Maintenance",
        sx: {
          background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
          color: "#0ea5e9",
          border: "1px solid #0ea5e920",
          fontWeight: 600,
        },
      };
    case "Retired":
      return {
        label: "Retired",
        sx: {
          background: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
          color: "#64748b",
          border: "1px solid #cbd5e1",
          fontWeight: 600,
        },
      };
    case "Lost":
      return {
        label: "Lost",
        sx: {
          background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
          color: "#bf8700",
          border: "1px solid #bf870020",
          fontWeight: 600,
        },
      };
    case "Sold":
      return {
        label: "Sold",
        sx: {
          background: "linear-gradient(135deg, #e9d5ff 0%, #faf5ff 100%)",
          color: "#7e22ce",
          border: "1px solid #7e22ce20",
          fontWeight: 600,
        },
      };
    default:
      return { label: status || "-", sx: {} };
  }
}

// // Summary tile palette by label
// export function tileTheme(label) {
//   const base = {
//     text: "#0f172a",
//     // border: "#e5e7eb",
//     color: "0969da",
//     bg: "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)",
//   };
//   if (/Total Value/i.test(label)) {
//     return {
//       text: "#166534",
//       color: "#1a7f37",
//       // border: "#bbf7d0",
//       bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
//     };
//   }
//   if (/Active/i.test(label)) {
//     return {
//       text: "#0ea5e9",
//       // border: "#bae6fd",
//       color: "#0ea5e9",

//       bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
//     };
//   }
//   if (/Maintenance/i.test(label)) {
//     return {
//       text: "#a16207",
//       // border: "#fde68a",
//       color: "#bf8700",

//       bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
//     };
//   }
//   if (/Retired|Lost|Sold/i.test(label)) {
//     return {
//       text: "#334155",
//       // border: "#e2e8f0",
//       color: "#64748b",
//       bg: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
//     };
//   }
//   return base;
// }

// utils/tileTheme.js
export function tileTheme(label) {
  const themes = [
    {
      test: /Total Assets/i,
      text: "#0f172a",
      color: "#0969da",
      bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
    },
    {
      test: /Total Value/i,
      text: "#166534",
      color: "#1a7f37",
      bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    },
    {
      test: /Active/i,
      text: "#0ea5e9",
      color: "#0ea5e9",
      bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
    },
    {
      test: /Maintenance/i,
      text: "#a16207",
      color: "#bf8700",
      bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
    },
    {
      test: /Retired|Lost|Sold/i,
      text: "#334155",
      color: "#64748b",
      bg: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
    },
  ];

  // find matching theme
  const found = themes.find((t) => t.test.test(label));

  // default fallback theme
  return (
    found || {
      text: "#0f172a",
      color: "#0969da",
      bg: "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)",
    }
  );
}
