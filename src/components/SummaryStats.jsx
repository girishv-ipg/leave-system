// components/SummaryStats.jsx

import { Box, Card, CardContent, Fade, Grid, Typography } from "@mui/material";
import {
  Cancel,
  CheckCircle,
  RequestQuote,
  Schedule,
  SupervisorAccount,
} from "@mui/icons-material";

/**
 * Summary Statistics Cards Component
 * Displays financial overview with status breakdown
 */
export default function SummaryStats({ totals, onStatClick, userRole }) {
  // Icon mapping
  const iconMap = {
    RequestQuote,
    CheckCircle,
    SupervisorAccount,
    Schedule,
    Cancel,
  };

  // Configure stats based on user role
  const getStatsConfig = () => {
    const baseStats = [
      {
        label: "Total Expenses",
        value: userRole === "finance" 
          ? (totals.approved || 0) + (totals.rejected || 0) + (totals.managerApproved || 0)
          : totals.total || 0,
        icon: "RequestQuote",
        color: "#0969da",
        bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
        border: "#0969da",
        key: "all",
      },
      {
        label: userRole === "finance" ? "Pending Review" : "Pending",
        value: userRole === "finance" ? (totals.managerApproved || 0) : (totals.pending || 0),
        icon: "Schedule",
        color: "#bf8700",
        bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
        border: "#bf8700",
        key: userRole === "finance" ? "managerApproved" : "pending",
      },
    ];

    // Add Manager Approved stat for admin/manager roles
    if (userRole === "admin" || userRole === "manager") {
      baseStats.push({
        label: "Manager Approved",
        value: totals.managerApproved || 0,
        icon: "SupervisorAccount",
        color: "#0ea5e9",
        bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
        border: "#0ea5e9",
        key: "managerApproved",
      });
    }

    baseStats.push(
      {
        label: "Fully Approved",
        value: totals.approved || 0,
        icon: "CheckCircle",
        color: "#1a7f37",
        bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
        border: "#1a7f37",
        key: "approved",
      },
      {
        label: "Rejected",
        value: totals.rejected || 0,
        icon: "Cancel",
        color: "#cf222e",
        bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
        border: "#cf222e",
        key: "rejected",
      }
    );

    return baseStats;
  };

  const stats = getStatsConfig();

  return (
    <Grid container spacing={2} sx={{ my: 3 }}>
      {stats.map((stat, index) => {
        const IconComponent = iconMap[stat.icon];

        return (
          <Grid
            item
            xs={6}
            sm={userRole === "employee" ? 3 : 2.4}
            key={stat.key}
            sx={{mx:"auto"}}
          >
            <Fade in timeout={300 + index * 100}>
              <Card
                elevation={1}
                onClick={() => onStatClick && onStatClick(stat.key)}
                sx={{
                  borderRadius: "8px",
                  background: stat.bg,
                  border: `1px solid ${stat.border}20`,
                  cursor: onStatClick ? "pointer" : "default",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": onStatClick ? {
                    transform: "translateY(-4px) scale(1.02)",
                    boxShadow: `0 20px 40px ${stat.color}20`,
                    borderColor: `${stat.border}40`,
                  } : {},
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <IconComponent
                      sx={{
                        fontSize: 20,
                        color: stat.color,
                        mr: 1,
                        transition: "transform 0.2s ease",
                        ".MuiCard-root:hover &": {
                          transform: "scale(1.1)",
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: stat.color,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      fontSize: "1.5rem",
                      lineHeight: 1,
                      fontFamily: '"SF Mono", "Monaco", monospace',
                    }}
                  >
                    ₹{stat.value.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        );
      })}
    </Grid>
  );
}