import React, { useEffect } from "react";
import {
  Drawer,
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
  open: boolean;
  onClose: () => void;
  satelliteId: string;
  groundStationId: string;
}

// Toast notifications are automatically configured in the latest version of react-toastify

const ContactWindows: React.FC<ContactWindowsProps> = ({
  open,
  onClose,
  satelliteId,
  groundStationId,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  const error = useSelector(selectContactWindowsError);

  useEffect(() => {
    if (open && satelliteId && groundStationId) {
      dispatch(fetchContactWindows({ satelliteId, groundStationId }));
    }
  }, [dispatch, open, satelliteId, groundStationId]);

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
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box style={{ width: 360, padding: 16 }}>
        <h3>Contact Windows</h3>

        {/* Refresh Button */}
        <Button
          variant="contained"
          onClick={refreshContactWindows}
          style={{ marginBottom: 16 }}
        >
          Refresh Contact Windows
        </Button>

        {status === "loading" && <div>Loading...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        {status === "succeeded" && contactWindows.length === 0 && (
          <div>No contact windows found.</div>
        )}

        {status === "succeeded" && contactWindows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>AOS</TableCell>
                <TableCell>LOS</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Max Elev (deg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contactWindows.map((win: any) => (
                <TableRow key={win._id}>
                  <TableCell>
                    {new Date(win.scheduledAOS).toISOString()} {/* Display AOS in UTC */}
                  </TableCell>
                  <TableCell>
                    {new Date(win.scheduledLOS).toISOString()} {/* Display LOS in UTC */}
                  </TableCell>
                  <TableCell>{(win.durationSeconds / 60).toFixed(0)}</TableCell>
                  <TableCell>{win.maxElevationDeg.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Button
          variant="outlined"
          onClick={onClose}
          style={{ marginTop: 16 }}
        >
          Close
        </Button>
      </Box>
    </Drawer>
  );
};

export default ContactWindows;