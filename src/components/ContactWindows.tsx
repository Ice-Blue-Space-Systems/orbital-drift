import React, { useEffect } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  fetchContactWindows,
  selectContactWindows,
  selectContactWindowsStatus,
  selectContactWindowsError,
} from "../store/contactWindowsSlice";
import { AppDispatch } from "../store";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ContactWindowsProps {
  satelliteId: string;
  groundStationId: string;
}

const ContactWindows: React.FC<ContactWindowsProps> = ({
  satelliteId,
  groundStationId,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  const error = useSelector(selectContactWindowsError);

  useEffect(() => {
    if (satelliteId && groundStationId) {
      console.log("Fetching Contact Windows for:", {
        satelliteId,
        groundStationId,
      });
      dispatch(fetchContactWindows({ satelliteId, groundStationId }));
    }
  }, [dispatch, satelliteId, groundStationId]);

  console.log("Contact Windows Data:", contactWindows);
  console.log("Contact Windows Status:", status);

  const refreshContactWindows = async () => {
    try {
      await axios.post("http://localhost:5000/api/contact-windows/refresh");
      toast.success("Contact windows refreshed successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      // Re-fetch contact windows after refresh
      if (satelliteId && groundStationId) {
        dispatch(fetchContactWindows({ satelliteId, groundStationId }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh contact windows.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <Box
      style={{
        width: "100%",
        height: "100%", // Ensure the component fills the height
        backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
        color: "#00ff00", // Green text
        fontFamily: "Courier New, Courier, monospace", // Console-style font
        padding: "16px",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent content from overflowing
      }}
    >
      <h3 style={{ margin: 0, marginBottom: "16px", color: "#00ff00" }}>
        Contact Windows
      </h3>

      {/* Refresh Button */}
      <Button
        variant="contained"
        onClick={refreshContactWindows}
        style={{
          marginBottom: 16,
          backgroundColor: "#00ff00",
          color: "#000000",
          fontFamily: "Courier New, Courier, monospace",
        }}
      >
        Refresh Contact Windows
      </Button>

      {status === "loading" && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {status === "succeeded" && contactWindows.length === 0 && (
        <div>No contact windows found.</div>
      )}

      {status === "succeeded" && contactWindows.length > 0 && (
        <Box
          style={{
            flex: 1, // Allow the table to grow and fill available space
            overflow: "auto", // Enable scrolling if content overflows
          }}
        >
          <Table
            size="small"
            style={{
              backgroundColor: "rgba(13, 13, 13, 0.9)", // Match console background
              color: "#00ff00", // Green text
              borderCollapse: "collapse", // Remove gaps between borders
              width: "100%", // Ensure the table fills the width
            }}
          >
            <TableHead>
              <TableRow
                style={{
                  borderBottom: "1px solid #00ff00", // Green border for header
                }}
              >
                <TableCell style={{ color: "#00ff00", border: "none" }}>AOS</TableCell>
                <TableCell style={{ color: "#00ff00", border: "none" }}>LOS</TableCell>
                <TableCell style={{ color: "#00ff00", border: "none" }}>
                  Duration (min)
                </TableCell>
                <TableCell style={{ color: "#00ff00", border: "none" }}>
                  Max Elev (deg)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contactWindows.map((win: any) => (
                <TableRow
                  key={win._id}
                  style={{
                    borderBottom: "1px solid rgba(0, 255, 0, 0.3)", // Subtle green border for rows
                  }}
                >
                  <TableCell style={{ color: "#00ff00", border: "none" }}>
                    {new Date(win.scheduledAOS).toISOString()}
                  </TableCell>
                  <TableCell style={{ color: "#00ff00", border: "none" }}>
                    {new Date(win.scheduledLOS).toISOString()}
                  </TableCell>
                  <TableCell style={{ color: "#00ff00", border: "none" }}>
                    {(win.durationSeconds / 60).toFixed(0)}
                  </TableCell>
                  <TableCell style={{ color: "#00ff00", border: "none" }}>
                    {win.maxElevationDeg.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default ContactWindows;