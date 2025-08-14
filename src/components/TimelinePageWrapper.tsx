import React, { Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";

// Lazy load the TimelinePage to reduce initial bundle size and improve route switching
const TimelinePageLazy = React.lazy(() => import("../TimelinePage"));

const TimelinePageWrapper: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          sx={{
            background: "linear-gradient(135deg, rgba(0, 30, 0, 0.9) 0%, rgba(0, 15, 0, 0.95) 50%, rgba(0, 20, 0, 0.9) 100%)"
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <TimelinePageLazy />
    </Suspense>
  );
};

export default TimelinePageWrapper;
