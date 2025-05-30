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
        color: "#00ff00", // Green text
        fontFamily: "Courier New, Courier, monospace", // Console-style font
        padding: "0", // Remove extra padding
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent content from overflowing
      }}
    >
      <h3
        style={{
          margin: "8px 0", // Add some spacing above and below the title
          padding: "0 8px", // Add padding to align with the table
          color: "#00ff00",
        }}
      >
        Contact Windows
      </h3>

      {/* Refresh Button */}
      <Button
        variant="contained"
        onClick={refreshContactWindows}
        style={{
          margin: "8px", // Add consistent margin around the button
          backgroundColor: "#00ff00",
          color: "#000000",
          fontFamily: "Courier New, Courier, monospace",
        }}
      >
        Refresh Contact Windows
      </Button>

      {status === "loading" && <div style={{ padding: "8px" }}>Loading...</div>}
      {error && <div style={{ color: "red", padding: "8px" }}>{error}</div>}

      {status === "succeeded" && contactWindows.length === 0 && (
        <div style={{ padding: "8px" }}>No contact windows found.</div>
      )}

      {status === "succeeded" && contactWindows.length > 0 && (
        <Box
          style={{
            flex: 1, // Allow the table to grow and fill available space
            overflow: "auto", // Enable scrolling if content overflows
            padding: "0 8px", // Add padding to align the table with the popover
          }}
        >
          <Table
            size="small"
            style={{
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
                <TableCell
                  style={{
                    color: "#00ff00",
                    border: "none",
                    padding: "4px 8px", // Add consistent padding
                  }}
                >
                  AOS
                </TableCell>
                <TableCell
                  style={{
                    color: "#00ff00",
                    border: "none",
                    padding: "4px 8px",
                  }}
                >
                  LOS
                </TableCell>
                <TableCell
                  style={{
                    color: "#00ff00",
                    border: "none",
                    padding: "4px 8px",
                  }}
                >
                  Duration (min)
                </TableCell>
                <TableCell
                  style={{
                    color: "#00ff00",
                    border: "none",
                    padding: "4px 8px",
                  }}
                >
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
                  <TableCell
                    style={{
                      color: "#00ff00",
                      border: "none",
                      padding: "4px 8px",
                    }}
                  >
                    {new Date(win.scheduledAOS).toISOString()}
                  </TableCell>
                  <TableCell
                    style={{
                      color: "#00ff00",
                      border: "none",
                      padding: "4px 8px",
                    }}
                  >
                    {new Date(win.scheduledLOS).toISOString()}
                  </TableCell>
                  <TableCell
                    style={{
                      color: "#00ff00",
                      border: "none",
                      padding: "4px 8px",
                    }}
                  >
                    {(win.durationSeconds / 60).toFixed(0)}
                  </TableCell>
                  <TableCell
                    style={{
                      color: "#00ff00",
                      border: "none",
                      padding: "4px 8px",
                    }}
                  >
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