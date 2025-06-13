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
    MenuItem,
    IconButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';
import { adminApi } from '../services/adminApi';
import NotificationSnackbar from './NotificationSnackbar';

const InvestorManagement = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [investors, setInvestors] = useState([]);
    const [formData, setFormData] = useState({
        name: ''
    });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);

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

    const fetchInvestors = useCallback(async () => {
        if (!selectedEvent) return;
        
        setLoading(true);
        try {
            const response = await adminApi.getInvestorsByEvent(selectedEvent);
            setInvestors(response || []);
        } catch (error) {
            console.error('Error fetching investors:', error);
            showNotification(error.response?.data?.message || 'Error fetching investors', 'error');
            setInvestors([]);
        } finally {
            setLoading(false);
        }
    }, [selectedEvent, showNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        if (selectedEvent) {
            const event = events.find(e => e._id === selectedEvent);
            setSelectedEventDetails(event);
            fetchInvestors();
        }
    }, [selectedEvent, events, fetchInvestors]);

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.createInvestor({
                name: formData.name,
                eventId: selectedEvent
            });
            showNotification('Investor created successfully');
            setFormData({ name: '' });
            fetchInvestors();
        } catch (error) {
            console.error('Error creating investor:', error);
            showNotification(
                error.response?.data?.message || 'Error creating investor',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this investor?')) return;
        
        setLoading(true);
        try {
            await adminApi.deleteInvestor(id);
            showNotification('Investor deleted successfully');
            fetchInvestors();
        } catch (error) {
            console.error('Error deleting investor:', error);
            showNotification(
                error.response?.data?.message || 'Error deleting investor',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const getInvestorLink = (investorId) => {
        return `${window.location.origin}/investor/${selectedEvent}/${investorId}`;
    };

    const copyInvestorLink = (investorId) => {
        const link = getInvestorLink(investorId);
        navigator.clipboard.writeText(link);
        showNotification('Investor link copied to clipboard');
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
                Investor Management
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Select Event"
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                        >
                            {events && events.length > 0 ? (
                                events.map((event) => (
                                    <MenuItem key={event._id} value={event._id}>
                                        {event.name} (Budget per investor: ${event.totalBudgetPerInvestor})
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No events available</MenuItem>
                            )}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {selectedEvent && (
                <>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={9}>
                                    <TextField
                                        fullWidth
                                        label="Investor Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary"
                                        fullWidth
                                        sx={{ height: '56px' }}
                                    >
                                        Add Investor
                                    </Button>
                                </Grid>
                            </Grid>
                            {selectedEventDetails && (
                                <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                                    Initial budget will be set to ${selectedEventDetails.totalBudgetPerInvestor}
                                </Typography>
                            )}
                        </form>
                    </Paper>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Initial Budget</TableCell>
                                    <TableCell>Remaining Budget</TableCell>
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
                                ) : investors && investors.length > 0 ? (
                                    investors.map((investor) => (
                                        <TableRow key={investor._id}>
                                            <TableCell>{investor.name}</TableCell>
                                            <TableCell>${selectedEventDetails?.totalBudgetPerInvestor}</TableCell>
                                            <TableCell>${investor.remainingBudget}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Copy Investor Link">
                                                    <IconButton onClick={() => copyInvestorLink(investor._id)} size="small">
                                                        <LinkIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton onClick={() => handleDelete(investor._id)} size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No investors found for this event
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default InvestorManagement;
