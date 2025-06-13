import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { adminApi } from '../services/adminApi';
import NotificationSnackbar from './NotificationSnackbar';
import { useNavigate } from 'react-router-dom';

const EventManagement = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        date: null,
        totalBudgetPerInvestor: ''
    });
    const [editingEvent, setEditingEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity
        });
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminApi.getAllEvents();
            setEvents(response || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            showNotification(error.response?.data?.message || 'Error fetching events', 'error');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingEvent) {
                await adminApi.updateEvent(editingEvent._id, formData);
                showNotification('Event updated successfully');
            } else {
                await adminApi.createEvent(formData);
                showNotification('Event created successfully');
            }
            setFormData({ name: '', date: null, totalBudgetPerInvestor: '' });
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            showNotification(
                error.response?.data?.message || 'Error saving event',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            date: new Date(event.date),
            totalBudgetPerInvestor: event.totalBudgetPerInvestor
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        
        setLoading(true);
        try {
            await adminApi.deleteEvent(id);
            showNotification('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification(
                error.response?.data?.message || 'Error deleting event',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <NotificationSnackbar
                open={notification.open}
                handleClose={handleCloseNotification}
                message={notification.message}
                severity={notification.severity}
            />
            <Typography variant="h5" gutterBottom>
                Event Management
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid md={4} lg={4}>
                            <TextField
                                fullWidth
                                label="Event Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid md={4} lg={4}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Event Date"
                                    value={formData.date}
                                    onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid md={4} lg={4}>
                            <TextField
                                fullWidth
                                label="Budget per Investor"
                                type="number"
                                value={formData.totalBudgetPerInvestor}
                                onChange={(e) => setFormData({ ...formData, totalBudgetPerInvestor: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" color="primary" disabled={loading}>
                                {editingEvent ? 'Update Event' : 'Create Event'}
                            </Button>
                            {editingEvent && (
                                <Button
                                    sx={{ ml: 1 }}
                                    variant="outlined"
                                    onClick={() => {
                                        setEditingEvent(null);
                                        setFormData({ name: '', date: null, totalBudgetPerInvestor: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Budget per Investor</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : events && events.length > 0 ? (
                            events.map((event) => (
                                <TableRow key={event._id}>
                                    <TableCell>{event.name}</TableCell>
                                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                                    <TableCell>${event.totalBudgetPerInvestor}</TableCell>
                                    <TableCell>
                                        <Tooltip title="View Results">
                                            <IconButton 
                                                onClick={() => navigate(`/results/${event._id}`)} 
                                                size="small"
                                                color="primary"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton onClick={() => handleEdit(event)} size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(event._id)} size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No events found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EventManagement;
