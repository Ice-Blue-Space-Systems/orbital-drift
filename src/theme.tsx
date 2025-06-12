import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(50, 50, 50, 0.9)", // Space-grey transparent background
          color: "#00ff00", // Bright green text
          border: "1px solid #00ff00", // Bright green border
          fontFamily: "Courier New, Courier, monospace", // Console-style font
          fontSize: "14px", // Adjust font size
          borderRadius: "4px", // Rounded corners
          padding: "8px", // Add padding
        },
        arrow: {
          color: "#00ff00", // Bright green arrow
        },
      },
    },
  },
});

export default theme;